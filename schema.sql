-- schema.sql : ERP de Gestion Maritime (PostgreSQL)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Standard audit columns function for updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. USERS & ROLES
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role_id UUID REFERENCES roles(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 2. FLEET (MODULE 1)
CREATE TABLE vessels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    imo_number VARCHAR(10) UNIQUE NOT NULL,
    flag VARCHAR(50),
    vessel_type VARCHAR(50),
    dwt NUMERIC(10, 2),
    draft NUMERIC(5, 2),
    year_built INTEGER,
    classification_society VARCHAR(100),
    status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 3. PORTS & VOYAGES (MODULE 2 & 4)
CREATE TABLE ports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    unlocode VARCHAR(10) UNIQUE NOT NULL,
    country VARCHAR(100),
    latitude NUMERIC(9, 6),
    longitude NUMERIC(9, 6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE voyages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voyage_number VARCHAR(50) UNIQUE NOT NULL,
    vessel_id UUID NOT NULL REFERENCES vessels(id),
    departure_port_id UUID REFERENCES ports(id),
    arrival_port_id UUID REFERENCES ports(id),
    planned_departure TIMESTAMP WITH TIME ZONE,
    planned_arrival TIMESTAMP WITH TIME ZONE,
    actual_departure TIMESTAMP WITH TIME ZONE,
    actual_arrival TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'PLANNED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE port_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voyage_id UUID NOT NULL REFERENCES voyages(id),
    port_id UUID NOT NULL REFERENCES ports(id),
    sequence_number INTEGER NOT NULL,
    eta TIMESTAMP WITH TIME ZONE,
    etd TIMESTAMP WITH TIME ZONE,
    ata TIMESTAMP WITH TIME ZONE,
    atd TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 4. CARGO (MODULE 3)
CREATE TABLE cargo_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_reference VARCHAR(50) UNIQUE NOT NULL,
    voyage_id UUID NOT NULL REFERENCES voyages(id),
    customer_name VARCHAR(150),
    loading_port_id UUID REFERENCES ports(id),
    discharge_port_id UUID REFERENCES ports(id),
    status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE cargo_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES cargo_bookings(id),
    container_number VARCHAR(50),
    equipment_type VARCHAR(20),
    weight_kg NUMERIC(10, 2),
    is_dangerous BOOLEAN DEFAULT false,
    imdg_class VARCHAR(20),
    seal_number VARCHAR(50),
    stowage_position VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE manifests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voyage_id UUID NOT NULL REFERENCES voyages(id),
    issue_date DATE,
    status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE bills_of_lading (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bl_number VARCHAR(100) UNIQUE NOT NULL,
    booking_id UUID NOT NULL REFERENCES cargo_bookings(id),
    manifest_id UUID REFERENCES manifests(id),
    shipper_name VARCHAR(200),
    consignee_name VARCHAR(200),
    issue_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 5. CREW (MODULE 5)
CREATE TABLE crew_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    seaman_book_number VARCHAR(50) UNIQUE NOT NULL,
    nationality VARCHAR(50),
    date_of_birth DATE,
    rank VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crew_member_id UUID NOT NULL REFERENCES crew_members(id),
    certificate_name VARCHAR(150) NOT NULL,
    certificate_number VARCHAR(100),
    issue_date DATE,
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE crew_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crew_member_id UUID NOT NULL REFERENCES crew_members(id),
    vessel_id UUID NOT NULL REFERENCES vessels(id),
    voyage_id UUID REFERENCES voyages(id),
    sign_on_date DATE,
    sign_off_date DATE,
    role_onboard VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 6. MAINTENANCE (MODULE 6)
CREATE TABLE maintenance_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vessel_id UUID NOT NULL REFERENCES vessels(id),
    component_name VARCHAR(150),
    task_description TEXT,
    interval_days INTEGER,
    last_done_date DATE,
    next_due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vessel_id UUID NOT NULL REFERENCES vessels(id),
    schedule_id UUID REFERENCES maintenance_schedules(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'OPEN',
    assigned_crew_id UUID REFERENCES crew_members(id),
    completed_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE spare_parts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vessel_id UUID NOT NULL REFERENCES vessels(id),
    part_number VARCHAR(100) NOT NULL,
    name VARCHAR(200) NOT NULL,
    quantity_onboard INTEGER DEFAULT 0,
    minimum_threshold INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 7. FUEL & BUNKERING (MODULE 7)
CREATE TABLE bunker_operations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vessel_id UUID NOT NULL REFERENCES vessels(id),
    port_id UUID REFERENCES ports(id),
    fuel_type VARCHAR(50),
    quantity_metric_tons NUMERIC(10, 2),
    sulfur_content NUMERIC(5, 2),
    operation_date DATE,
    supplier_name VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE fuel_consumptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voyage_id UUID NOT NULL REFERENCES voyages(id),
    vessel_id UUID NOT NULL REFERENCES vessels(id),
    report_date DATE NOT NULL,
    hfo_consumed NUMERIC(10, 2) DEFAULT 0,
    vlsfo_consumed NUMERIC(10, 2) DEFAULT 0,
    mgo_consumed NUMERIC(10, 2) DEFAULT 0,
    distance_steamed NUMERIC(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 8. FINANCE (MODULE 8)
CREATE TABLE voyage_costs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voyage_id UUID NOT NULL REFERENCES voyages(id),
    cost_category VARCHAR(100),
    amount_usd NUMERIC(15, 2),
    description TEXT,
    incurred_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE port_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    port_call_id UUID NOT NULL REFERENCES port_calls(id),
    expense_type VARCHAR(100), -- PDA, FDA, etc.
    amount_usd NUMERIC(15, 2),
    invoice_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE freight_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES cargo_bookings(id),
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    amount_usd NUMERIC(15, 2),
    issue_date DATE,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 9. DOCUMENTS (MODULE 9)
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vessel_id UUID REFERENCES vessels(id),
    voyage_id UUID REFERENCES voyages(id),
    document_type VARCHAR(100),
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vessel_id UUID NOT NULL REFERENCES vessels(id),
    name VARCHAR(150) NOT NULL,
    issuer VARCHAR(150),
    issue_date DATE,
    expiry_date DATE,
    status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 10. COMMUNICATIONS (MODULE 10)
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES users(id),
    receiver_id UUID REFERENCES users(id),
    vessel_id UUID REFERENCES vessels(id),
    subject VARCHAR(255),
    body TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(200),
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE vessel_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vessel_id UUID NOT NULL REFERENCES vessels(id),
    latitude NUMERIC(9, 6),
    longitude NUMERIC(9, 6),
    speed_knots NUMERIC(5, 2),
    heading INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- TRIGGERS SETUP (Exemple générique)
CREATE TRIGGER trigger_update_users BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER trigger_update_vessels BEFORE UPDATE ON vessels FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
-- (Les autres triggers pour *chaque* table suivent la même structure)
