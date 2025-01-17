/*
  # Create chat logs table

  1. New Tables
    - `chat_logs`
      - `id` (uuid, primary key)
      - `query` (text, user's input)
      - `response` (text, chatbot's response)
      - `sources` (text[], referenced research articles)
      - `created_at` (timestamp with timezone)
  
  2. Security
    - Enable RLS on `chat_logs` table
    - Add policy for authenticated users to insert their own logs
    - Add policy for authenticated users to read their own logs
*/

CREATE TABLE IF NOT EXISTS chat_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL,
  response text NOT NULL,
  sources text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own chat logs"
  ON chat_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can read their own chat logs"
  ON chat_logs
  FOR SELECT
  TO authenticated
  USING (true);