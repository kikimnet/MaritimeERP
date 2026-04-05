export const ExternalServices = {
    /**
     * MOCK: Get Vessel Route info and Weather forecast from ECMWF/Windy mock
     * In reality: GET from weather API (Windy, ECMWF) using route polygons.
     */
    async getWeatherForecast(routeWaypoints: any[]) {
        // Simulate API delay
        await new Promise(r => setTimeout(r, 500));
        
        // Return realistic mock weather risks
        const risks = [];
        if (Math.random() > 0.5) {
            risks.push({
                type: 'weather',
                severity: 'medium',
                description: 'Vents contraires (force 6-7) prévus dans le Golfe.'
            });
        }
        
        // 10% chance of ice conditions depending on the season (we just mock it randomly)
        if (Math.random() > 0.9) {
            risks.push({
                type: 'ice',
                severity: 'high',
                description: 'Glace > 5/10 prévue. Navigation lente requise.'
            });
        }

        return risks;
    },

    /**
     * MOCK: Get live bunker prices from Ship & Bunker API
     * Returns USD / mt prices for HFO, VLSFO, MGO
     */
    async getLiveFuelPrices(portLocodes: string[]) {
        // Simulate API delay
        await new Promise(r => setTimeout(r, 400));
        
        // Base realistic prices
        const basePrices = {
            HFO: 450,
            VLSFO: 620,
            MGO: 810
        };

        const result: Record<string, any> = {};
        for (const port of portLocodes) {
            // Apply a slight random modifier per port
            const modifier = 1 + (Math.random() * 0.1 - 0.05); 
            result[port] = {
                HFO: Math.round(basePrices.HFO * modifier),
                VLSFO: Math.round(basePrices.VLSFO * modifier),
                MGO: Math.round(basePrices.MGO * modifier)
            };
        }
        return result;
    },

    /**
     * MOCK: MarineTraffic AIS Position
     * Will be used in Module 2 live tracking
     */
    async getVesselAIS(mmsi: string | number) {
        // Here we would fetch: GET /vessels/details/mmsi/{mmsi}?protocol=jsono
        await new Promise(r => setTimeout(r, 300));
        return {
            LAT: 46.8 + (Math.random() - 0.5) * 5,
            LON: -71.2 + (Math.random() - 0.5) * 5,
            SPEED: 10 + Math.random() * 5, // Knots
            COURSE: Math.random() * 360,
            HEADING: Math.random() * 360,
            STATUS: 0, // 0 = under way using engine
            TIMESTAMP: new Date().toISOString()
        };
    }
};
