import { pool } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { ExternalServices } from './external';

interface AIScenarioRequest {
    voyage_id?: string;
    vessel_id: string;
    port_of_departure: string;
    port_of_arrival: string;
    waypoints: any[];
    operator_constraints: any;
}

export const AIOptimizerService = {
    /**
     * MOCK: Generates 3 scenarios identical to Claude API
     */
    async generateScenarios(req: AIScenarioRequest) {
        // 1. Gather data context (simulate gathering)
        const waypointsLocodes = [req.port_of_departure, ...req.waypoints.map(w => w.port_locode), req.port_of_arrival];
        const prices = await ExternalServices.getLiveFuelPrices(waypointsLocodes);
        const risks = await ExternalServices.getWeatherForecast(req.waypoints);

        // Simulate length of an LLM generation (e.g. Claude Sonnet 4.6 taking 8 seconds)
        await new Promise(r => setTimeout(r, 3000)); // We use 3s for developer sanity, ideally 8-15s

        // 2. Build the JSON output matching schema defined in prompt 6.3
        const generatedResponse = {
            voyage_request_id: uuidv4(),
            generated_at: new Date().toISOString(),
            data_sources_used: ["historical_voyages", "weather_api", "fuel_prices"],
            scenarios: {
                scenario_a: {
                    id: "scenario_a",
                    name: "Économique",
                    optimization_axis: "cost_minimization",
                    recommended: false,
                    data_confidence: "high",
                    kpis: {
                        estimated_cost_cad: 148200,
                        estimated_duration_days: 18.2,
                        cruising_speed_knots: 11.5,
                        total_fuel_consumption_mt: 187.4,
                        fuel_cost_cad: 116900,
                        port_costs_cad: 21400,
                        distance_nm: 2840,
                        co2_emissions_mt: 592.1
                    },
                    route: {
                        waypoints: [
                            { port_locode: req.port_of_departure, role: "departure", etd: new Date().toISOString() },
                            { port_locode: "CASEP", role: "bunker_stop", reason: "Bunkering VLSFO moins cher" },
                            { port_locode: req.port_of_arrival, role: "destination" }
                        ]
                    },
                    ai_reasoning: "Vitesse réduite 11.5 nœuds économise 37 tm carburant. Escale intermédiaire rentable grâce à un écart de prix de soute compensant largement les frais de port.",
                    risks: risks,
                    operator_adjustments_allowed: ["speed", "waypoints", "departure_date", "bunker_port"]
                },
                scenario_b: {
                    id: "scenario_b",
                    name: "Rapide",
                    optimization_axis: "delay_minimization",
                    recommended: false,
                    data_confidence: "high",
                    kpis: {
                        estimated_cost_cad: 181500,
                        estimated_duration_days: 14.1,
                        cruising_speed_knots: 14.5,
                        total_fuel_consumption_mt: 245.2,
                        fuel_cost_cad: 152000,
                        port_costs_cad: 21400,
                        distance_nm: 2840,
                        co2_emissions_mt: 775.3
                    },
                    route: {
                        waypoints: [
                            { port_locode: req.port_of_departure, role: "departure", etd: new Date().toISOString() },
                            { port_locode: req.port_of_arrival, role: "destination" }
                        ]
                    },
                    ai_reasoning: "Pleine puissance navire (14.5 nds) pour respecter impératif commercial court. Pas de ravitaillement intermédiaire; nécessite un départ avec soutes pleines. Coût CO2 très élevé.",
                    risks: risks,
                    operator_adjustments_allowed: ["speed", "departure_date"]
                },
                scenario_c: {
                    id: "scenario_c",
                    name: "Équilibré",
                    optimization_axis: "multi_criteria",
                    recommended: true,
                    data_confidence: "high",
                    kpis: {
                        estimated_cost_cad: 162000,
                        estimated_duration_days: 16.5,
                        cruising_speed_knots: 12.8,
                        total_fuel_consumption_mt: 205.0,
                        fuel_cost_cad: 129000,
                        port_costs_cad: 21400,
                        distance_nm: 2840,
                        co2_emissions_mt: 648.5
                    },
                    route: {
                        waypoints: [
                            { port_locode: req.port_of_departure, role: "departure", etd: new Date().toISOString() },
                            { port_locode: req.port_of_arrival, role: "destination" }
                        ]
                    },
                    ai_reasoning: "Meilleur ratio historique. Vraie vitesse commerciale usuelle. Limite l'usure moteur tout en livrant avec une marge de sécurité de 48h par rapport aux dates limites habituelles de cette route.",
                    risks: risks,
                    operator_adjustments_allowed: ["speed", "waypoints", "departure_date"]
                }
            },
            comparison_summary: {
                cheapest: "scenario_a",
                fastest: "scenario_b",
                best_ratio: "scenario_c",
                cost_range_cad: { min: 148200, max: 181500 },
                duration_range_days: { min: 14.1, max: 18.2 }
            }
        };

        // 3. Save to database as per step 5 in prompt
        const insertQuery = `
            INSERT INTO voyage_ai_scenarios 
            (voyage_id, raw_prompt, raw_response, scenario_a, scenario_b, scenario_c, status, model_used, tokens_used, latency_ms, expires_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id
        `;

        // Expires in 72hours
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 72);

        const { rows } = await pool.query(insertQuery, [
            req.voyage_id || null,
            "MOCK_SYSTEM_PROMPT",
            JSON.stringify(generatedResponse),
            JSON.stringify(generatedResponse.scenarios.scenario_a),
            JSON.stringify(generatedResponse.scenarios.scenario_b),
            JSON.stringify(generatedResponse.scenarios.scenario_c),
            'generated',
            'claude-sonnet-4-6 (Mock)',
            7854,
            3024,
            expiresAt
        ]);

        return {
            session_id: rows[0].id,
            ...generatedResponse
        };
    }
};
