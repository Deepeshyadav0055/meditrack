-- MediTrack Database Schema for Supabase PostgreSQL
-- Real-Time Bed & Blood Availability System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE bed_type_enum AS ENUM ('ICU', 'general', 'paediatric', 'maternity', 'isolation', 'emergency', 'ventilator');
CREATE TYPE blood_group_enum AS ENUM ('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-');
CREATE TYPE staff_role_enum AS ENUM ('admin', 'doctor', 'nurse', 'data_entry');
CREATE TYPE update_type_enum AS ENUM ('bed', 'blood');
CREATE TYPE severity_enum AS ENUM ('low', 'medium', 'high', 'critical');

-- =============================================
-- TABLE: hospitals
-- =============================================
CREATE TABLE hospitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    city TEXT NOT NULL,
    district TEXT,
    state TEXT DEFAULT 'Maharashtra',
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    phone TEXT,
    email TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster city/district queries
CREATE INDEX idx_hospitals_city ON hospitals(city);
CREATE INDEX idx_hospitals_district ON hospitals(district);
CREATE INDEX idx_hospitals_active ON hospitals(is_active);

-- =============================================
-- TABLE: bed_inventory
-- =============================================
CREATE TABLE bed_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    bed_type bed_type_enum NOT NULL,
    total_beds INTEGER NOT NULL DEFAULT 0,
    available_beds INTEGER NOT NULL DEFAULT 0,
    occupied_beds INTEGER GENERATED ALWAYS AS (total_beds - available_beds) STORED,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),
    CONSTRAINT valid_bed_count CHECK (available_beds >= 0 AND available_beds <= total_beds),
    UNIQUE(hospital_id, bed_type)
);

-- Index for faster queries
CREATE INDEX idx_bed_inventory_hospital ON bed_inventory(hospital_id);
CREATE INDEX idx_bed_inventory_type ON bed_inventory(bed_type);
CREATE INDEX idx_bed_inventory_available ON bed_inventory(available_beds);

-- =============================================
-- TABLE: blood_inventory
-- =============================================
CREATE TABLE blood_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    blood_group blood_group_enum NOT NULL,
    units_available INTEGER NOT NULL DEFAULT 0,
    units_reserved INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),
    CONSTRAINT valid_blood_units CHECK (units_available >= 0 AND units_reserved >= 0),
    UNIQUE(hospital_id, blood_group)
);

-- Index for faster queries
CREATE INDEX idx_blood_inventory_hospital ON blood_inventory(hospital_id);
CREATE INDEX idx_blood_inventory_group ON blood_inventory(blood_group);
CREATE INDEX idx_blood_inventory_available ON blood_inventory(units_available);

-- =============================================
-- TABLE: hospital_staff
-- =============================================
CREATE TABLE hospital_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    role staff_role_enum NOT NULL DEFAULT 'data_entry',
    name TEXT NOT NULL,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, hospital_id)
);

-- Index for faster queries
CREATE INDEX idx_hospital_staff_user ON hospital_staff(user_id);
CREATE INDEX idx_hospital_staff_hospital ON hospital_staff(hospital_id);

-- =============================================
-- TABLE: update_logs
-- =============================================
CREATE TABLE update_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    update_type update_type_enum NOT NULL,
    field_changed TEXT NOT NULL,
    old_value INTEGER,
    new_value INTEGER,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_update_logs_hospital ON update_logs(hospital_id);
CREATE INDEX idx_update_logs_time ON update_logs(changed_at DESC);

-- =============================================
-- TABLE: alerts
-- =============================================
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL,
    message TEXT NOT NULL,
    severity severity_enum NOT NULL DEFAULT 'medium',
    is_resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_alerts_hospital ON alerts(hospital_id);
CREATE INDEX idx_alerts_resolved ON alerts(is_resolved);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_created ON alerts(created_at DESC);

-- =============================================
-- TRIGGERS for automatic timestamp updates
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_hospitals_updated_at BEFORE UPDATE ON hospitals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- TRIGGERS for automatic last_updated on inventory
-- =============================================
CREATE OR REPLACE FUNCTION update_last_updated_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bed_inventory_last_updated BEFORE UPDATE ON bed_inventory
    FOR EACH ROW EXECUTE FUNCTION update_last_updated_column();

CREATE TRIGGER update_blood_inventory_last_updated BEFORE UPDATE ON blood_inventory
    FOR EACH ROW EXECUTE FUNCTION update_last_updated_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE bed_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE update_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Public read access for hospitals and inventories
CREATE POLICY "Public read access for hospitals" ON hospitals
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public read access for bed inventory" ON bed_inventory
    FOR SELECT USING (true);

CREATE POLICY "Public read access for blood inventory" ON blood_inventory
    FOR SELECT USING (true);

CREATE POLICY "Public read access for alerts" ON alerts
    FOR SELECT USING (true);

-- Staff can update their own hospital's inventory
CREATE POLICY "Staff can update bed inventory" ON bed_inventory
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM hospital_staff
            WHERE hospital_staff.user_id = auth.uid()
            AND hospital_staff.hospital_id = bed_inventory.hospital_id
            AND hospital_staff.is_active = true
        )
    );

CREATE POLICY "Staff can update blood inventory" ON blood_inventory
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM hospital_staff
            WHERE hospital_staff.user_id = auth.uid()
            AND hospital_staff.hospital_id = blood_inventory.hospital_id
            AND hospital_staff.is_active = true
        )
    );

-- Staff can view their own records
CREATE POLICY "Staff can view own records" ON hospital_staff
    FOR SELECT USING (user_id = auth.uid());

-- Update logs are readable by authenticated users
CREATE POLICY "Authenticated users can read update logs" ON update_logs
    FOR SELECT USING (auth.role() = 'authenticated');

-- =============================================
-- REALTIME PUBLICATION
-- =============================================
-- Enable realtime for inventory tables
ALTER PUBLICATION supabase_realtime ADD TABLE bed_inventory;
ALTER PUBLICATION supabase_realtime ADD TABLE blood_inventory;
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to get hospital summary with bed and blood counts
CREATE OR REPLACE FUNCTION get_hospital_summary(hospital_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'hospital', (SELECT row_to_json(h) FROM hospitals h WHERE h.id = hospital_uuid),
        'beds', (SELECT json_agg(row_to_json(b)) FROM bed_inventory b WHERE b.hospital_id = hospital_uuid),
        'blood', (SELECT json_agg(row_to_json(bl)) FROM blood_inventory bl WHERE bl.hospital_id = hospital_uuid)
    ) INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate total available beds for a hospital
CREATE OR REPLACE FUNCTION get_total_available_beds(hospital_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    total INTEGER;
BEGIN
    SELECT COALESCE(SUM(available_beds), 0) INTO total
    FROM bed_inventory
    WHERE hospital_id = hospital_uuid;
    RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE hospitals IS 'Government hospitals registered in the system';
COMMENT ON TABLE bed_inventory IS 'Real-time bed availability by type for each hospital';
COMMENT ON TABLE blood_inventory IS 'Real-time blood unit availability by group for each hospital';
COMMENT ON TABLE hospital_staff IS 'Staff members authorized to update hospital data';
COMMENT ON TABLE update_logs IS 'Audit trail of all inventory updates';
COMMENT ON TABLE alerts IS 'System-generated alerts for critical shortages';
