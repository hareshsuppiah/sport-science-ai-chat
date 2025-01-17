/*
  # Update chat_logs RLS policies

  1. Changes
    - Allow anonymous users to insert chat logs
    - Allow anonymous users to read chat logs
    - Remove authenticated-only restrictions

  2. Security
    - Enable RLS on chat_logs table
    - Add policies for anonymous access
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own chat logs" ON chat_logs;
DROP POLICY IF EXISTS "Users can read their own chat logs" ON chat_logs;

-- Create new policies for anonymous access
CREATE POLICY "Allow anonymous insert"
  ON chat_logs
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous select"
  ON chat_logs
  FOR SELECT
  TO anon
  USING (true);