-- Tabla de Familias
CREATE TABLE IF NOT EXISTS families (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  notes TEXT,
  phone VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Invitados
CREATE TABLE IF NOT EXISTS guests (
  id SERIAL PRIMARY KEY,
  family_id INTEGER REFERENCES families(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  partner_name VARCHAR(255),
  type VARCHAR(100) DEFAULT 'Adulto',
  group_relation VARCHAR(150),
  guest_type VARCHAR(100) DEFAULT 'Titular',
  priority VARCHAR(50) DEFAULT 'A',
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'confirmed', 'declined'
  confirmed_seats INTEGER DEFAULT 1,
  dietary_notes TEXT,
  notes TEXT,
  phone VARCHAR(50),
  table_assigned VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para búsquedas y filtros rápidos
CREATE INDEX IF NOT EXISTS idx_guests_family_id ON guests(family_id);
CREATE INDEX IF NOT EXISTS idx_guests_status ON guests(status);
CREATE INDEX IF NOT EXISTS idx_guests_priority ON guests(priority);
CREATE INDEX IF NOT EXISTS idx_guests_group_relation ON guests(group_relation);
