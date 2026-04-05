import { pool } from '../db';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const migrate = async () => {
    const client = await pool.connect();
    try {
        console.log('Starting Module 2 migrations...');
        await client.query('BEGIN');

        // Drop foreign keys that reference voyages to prevent cascading table drops
        const tablesToUnlink = [
            'crew_assignments', 'port_calls', 'cargo_bookings', 
            'manifests', 'documents', 'fuel_consumptions', 'voyage_costs'
        ];

        for (const table of tablesToUnlink) {
            try {
                await client.query(`ALTER TABLE ${table} DROP CONSTRAINT IF EXISTS ${table}_voyage_id_fkey`);
            } catch (err: any) {
                console.log(`Could not drop constraint on ${table}: ${err.message}`);
            }
        }

        // Drop Module 2 tables
        await client.query('DROP TABLE IF EXISTS port_tariffs CASCADE');
        await client.query('DROP TABLE IF EXISTS voyage_ai_scenarios CASCADE');
        await client.query('DROP TABLE IF EXISTS voyage_documents CASCADE');
        await client.query('DROP TABLE IF EXISTS voyage_log_entries CASCADE');
        await client.query('DROP TABLE IF EXISTS voyage_alerts CASCADE');
        await client.query('DROP TABLE IF EXISTS noon_reports CASCADE');
        await client.query('DROP TABLE IF EXISTS vessel_positions CASCADE');
        await client.query('DROP TABLE IF EXISTS voyage_waypoints CASCADE');
        await client.query('DROP TABLE IF EXISTS voyages CASCADE');

        console.log('Creating ENUMs...');
        await client.query('DROP TYPE IF EXISTS voyage_type_enum CASCADE');
        await client.query("CREATE TYPE voyage_type_enum AS ENUM ('cargo', 'ballast', 'mixed', 'positioning')");
        
        await client.query('DROP TYPE IF EXISTS voyage_status_enum CASCADE');
        await client.query("CREATE TYPE voyage_status_enum AS ENUM ('planned', 'confirmed', 'in_progress', 'in_port', 'arrived', 'closed')");
        
        await client.query('DROP TYPE IF EXISTS fuel_type_enum CASCADE');
        await client.query("CREATE TYPE fuel_type_enum AS ENUM ('HFO', 'VLSFO', 'MGO', 'LNG', 'DUAL_FUEL')");
        
        await client.query('DROP TYPE IF EXISTS cargo_type_enum CASCADE');
        await client.query("CREATE TYPE cargo_type_enum AS ENUM ('containers', 'dry_bulk', 'liquid_bulk', 'heavy_lift', 'general')");

        console.log('Creating voyages table...');
        await client.query(`
            CREATE TABLE voyages (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                voyage_number VARCHAR(50) UNIQUE NOT NULL,
                commercial_name VARCHAR(200),
                voyage_type voyage_type_enum,
                status voyage_status_enum DEFAULT 'planned',
                vessel_id UUID REFERENCES vessels(id),
                operator_id UUID REFERENCES users(id),
                port_of_departure VARCHAR(5),
                port_of_arrival VARCHAR(5),
                etd_planned TIMESTAMP WITH TIME ZONE,
                eta_planned TIMESTAMP WITH TIME ZONE,
                eta_current TIMESTAMP WITH TIME ZONE,
                atd TIMESTAMP WITH TIME ZONE,
                ata TIMESTAMP WITH TIME ZONE,
                speed_planned DECIMAL(5,2),
                draft_laden DECIMAL(5,2),
                draft_ballast DECIMAL(5,2),
                fuel_type_main fuel_type_enum,
                hfo_on_departure DECIMAL(8,2),
                vlsfo_on_departure DECIMAL(8,2),
                mgo_on_departure DECIMAL(8,2),
                total_distance_nm DECIMAL(10,2),
                cargo_type cargo_type_enum,
                ai_scenario_id UUID,
                charter_party_ref VARCHAR(100),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                created_by UUID REFERENCES users(id),
                deleted_at TIMESTAMP WITH TIME ZONE
            )
        `);

        console.log('Creating voyage_waypoints...');
        await client.query(`
            CREATE TABLE voyage_waypoints (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                voyage_id UUID NOT NULL REFERENCES voyages(id) ON DELETE CASCADE,
                order_index INTEGER NOT NULL,
                port_locode VARCHAR(5) NOT NULL,
                terminal VARCHAR(150),
                eta_planned TIMESTAMP WITH TIME ZONE,
                etd_planned TIMESTAMP WITH TIME ZONE,
                eta_actual TIMESTAMP WITH TIME ZONE,
                etd_actual TIMESTAMP WITH TIME ZONE,
                status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                created_by UUID REFERENCES users(id),
                deleted_at TIMESTAMP WITH TIME ZONE
            )
        `);

        console.log('Creating vessel_positions...');
        await client.query(`
            CREATE TABLE vessel_positions (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                voyage_id UUID REFERENCES voyages(id) ON DELETE CASCADE,
                vessel_id UUID NOT NULL REFERENCES vessels(id),
                recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
                latitude NUMERIC(9,6),
                longitude NUMERIC(9,6),
                sog DECIMAL(5,2),
                cog DECIMAL(5,2),
                hdg DECIMAL(5,2),
                nav_status VARCHAR(50),
                source VARCHAR(50),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);

        console.log('Creating noon_reports...');
        await client.query(`
            CREATE TABLE noon_reports (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                voyage_id UUID NOT NULL REFERENCES voyages(id) ON DELETE CASCADE,
                report_date TIMESTAMP WITH TIME ZONE NOT NULL,
                lat NUMERIC(9,6),
                lng NUMERIC(9,6),
                dist_last_noon DECIMAL(10,2),
                dist_remaining DECIMAL(10,2),
                avg_speed DECIMAL(5,2),
                hfo_consumed DECIMAL(8,2),
                vlsfo_consumed DECIMAL(8,2),
                mgo_consumed DECIMAL(8,2),
                hfo_remaining DECIMAL(8,2),
                vlsfo_remaining DECIMAL(8,2),
                mgo_remaining DECIMAL(8,2),
                wind_beaufort INTEGER,
                sea_state VARCHAR(50),
                visibility VARCHAR(50),
                remarks TEXT,
                signed_by UUID REFERENCES users(id),
                signed_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);

        console.log('Creating voyage_alerts...');
        await client.query(`
            CREATE TABLE voyage_alerts (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                voyage_id UUID NOT NULL REFERENCES voyages(id) ON DELETE CASCADE,
                alert_type VARCHAR(50),
                severity VARCHAR(20),
                triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                message TEXT NOT NULL,
                acknowledged_by UUID REFERENCES users(id),
                acknowledged_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);

        console.log('Creating voyage_log_entries...');
        await client.query(`
            CREATE TABLE voyage_log_entries (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                voyage_id UUID NOT NULL REFERENCES voyages(id) ON DELETE CASCADE,
                entry_type VARCHAR(50),
                category VARCHAR(50),
                description TEXT NOT NULL,
                author_id UUID REFERENCES users(id),
                recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                attachments JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);

        console.log('Creating voyage_documents...');
        await client.query(`
            CREATE TABLE voyage_documents (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                voyage_id UUID NOT NULL REFERENCES voyages(id) ON DELETE CASCADE,
                doc_type VARCHAR(50),
                file_path TEXT,
                generated_at TIMESTAMP WITH TIME ZONE,
                signed_by UUID REFERENCES users(id),
                signed_at TIMESTAMP WITH TIME ZONE,
                status VARCHAR(50) DEFAULT 'draft',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);

        console.log('Creating voyage_ai_scenarios...');
        await client.query(`
            CREATE TABLE voyage_ai_scenarios (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                voyage_id UUID REFERENCES voyages(id) ON DELETE CASCADE,
                request_context JSONB,
                raw_prompt TEXT,
                raw_response JSONB,
                scenario_a JSONB,
                scenario_b JSONB,
                scenario_c JSONB,
                selected_scenario VARCHAR(12),
                operator_overrides JSONB,
                model_used VARCHAR(50),
                tokens_used INTEGER,
                latency_ms INTEGER,
                status VARCHAR(50) DEFAULT 'pending',
                expires_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);

        console.log('Creating port_tariffs...');
        await client.query(`
            CREATE TABLE port_tariffs (
                port_locode VARCHAR(5) PRIMARY KEY,
                port_name VARCHAR(200),
                port_dues_per_dwt DECIMAL(10,4),
                pilotage_cost DECIMAL(10,2),
                towage_cost DECIMAL(10,2),
                agent_fee DECIMAL(10,2),
                bunker_vlsfo DECIMAL(10,2),
                bunker_hfo DECIMAL(10,2),
                bunker_mgo DECIMAL(10,2),
                turnaround_hours_avg DECIMAL(6,1),
                draft_restriction_m DECIMAL(5,2),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);

        // Reconnect foreign keys to voyages table
        console.log('Linking foreign keys back...');
        for (const table of tablesToUnlink) {
            try {
                // Ignore missing columns safely if they don't exist
                await client.query(`ALTER TABLE ${table} ADD CONSTRAINT ${table}_voyage_id_fkey FOREIGN KEY (voyage_id) REFERENCES voyages(id)`);
            } catch (err: any) {
                console.log(`Column voyage_id may not exist in ${table}, skipping FK add: ${err.message}`);
            }
        }

        console.log('Inserting mock tariffs data...');
        await client.query(`
            INSERT INTO port_tariffs (port_locode, port_name, port_dues_per_dwt, pilotage_cost, towage_cost, agent_fee, bunker_vlsfo, bunker_hfo, bunker_mgo, turnaround_hours_avg)
            VALUES 
            ('CATRQ', 'Trois-Rivières', 0.12, 1200.00, 3500.00, 800.00, 624.00, 480.00, 810.00, 36.0),
            ('CASEP', 'Sept-Îles', 0.15, 1400.00, 4200.00, 950.00, 605.00, 460.00, 790.00, 48.0),
            ('CAMTR', 'Montréal', 0.18, 1800.00, 5000.00, 1100.00, 640.00, 500.00, 840.00, 72.0)
            ON CONFLICT (port_locode) DO NOTHING;
        `);

        await client.query('COMMIT');
        console.log('Migration Module 2 completed successfully.');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Error during migration:', e);
    } finally {
        client.release();
        pool.end();
    }
};

migrate();
