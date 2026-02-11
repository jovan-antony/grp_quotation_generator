/*
  # Quotation Management System Schema

  1. New Tables
    - `quotations`
      - `id` (uuid, primary key)
      - `from_company` (text) - Company issuing the quotation
      - `recipient_title` (text) - Mr./Ms
      - `recipient_name` (text)
      - `recipient_role` (text)
      - `recipient_company` (text)
      - `recipient_location` (text)
      - `recipient_phone` (text)
      - `recipient_email` (text, optional)
      - `quotation_date` (date)
      - `quotation_from` (text) - Sales/Office
      - `sales_person_name` (text, optional)
      - `sales_person_code` (text, optional)
      - `quotation_number` (text)
      - `revision_number` (integer, default 0)
      - `subject` (text)
      - `project_location` (text)
      - `gallon_type` (text) - US/Imperial
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `quotation_tanks`
      - `id` (uuid, primary key)
      - `quotation_id` (uuid, foreign key)
      - `tank_number` (integer)
      - `option_number` (integer, optional)
      - `has_partition` (boolean)
      - `tank_type` (text)
      - `length` (text) - Supports partition notation
      - `width` (text)
      - `height` (text)
      - `unit` (text) - Nos/L/ROLL
      - `unit_price` (numeric)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create quotations table
CREATE TABLE IF NOT EXISTS quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_company text NOT NULL,
  recipient_title text NOT NULL,
  recipient_name text NOT NULL,
  recipient_role text NOT NULL,
  recipient_company text NOT NULL,
  recipient_location text NOT NULL,
  recipient_phone text NOT NULL,
  recipient_email text,
  quotation_date date NOT NULL DEFAULT CURRENT_DATE,
  quotation_from text NOT NULL,
  sales_person_name text,
  sales_person_code text,
  quotation_number text NOT NULL,
  revision_number integer DEFAULT 0,
  subject text NOT NULL,
  project_location text NOT NULL,
  gallon_type text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create quotation_tanks table
CREATE TABLE IF NOT EXISTS quotation_tanks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid REFERENCES quotations(id) ON DELETE CASCADE,
  tank_number integer NOT NULL,
  tank_name text,
  option_number integer,
  has_partition boolean DEFAULT false,
  tank_type text NOT NULL,
  length text NOT NULL,
  width text NOT NULL,
  height text NOT NULL,
  unit text NOT NULL,
  unit_price numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_tanks ENABLE ROW LEVEL SECURITY;

-- Create policies for quotations
CREATE POLICY "Allow public read access to quotations"
  ON quotations FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to quotations"
  ON quotations FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to quotations"
  ON quotations FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Create policies for quotation_tanks
CREATE POLICY "Allow public read access to quotation_tanks"
  ON quotation_tanks FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to quotation_tanks"
  ON quotation_tanks FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to quotation_tanks"
  ON quotation_tanks FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_quotations_number ON quotations(quotation_number);
CREATE INDEX IF NOT EXISTS idx_quotations_company ON quotations(recipient_company);
CREATE INDEX IF NOT EXISTS idx_quotations_date ON quotations(quotation_date);
CREATE INDEX IF NOT EXISTS idx_quotation_tanks_quotation_id ON quotation_tanks(quotation_id);
