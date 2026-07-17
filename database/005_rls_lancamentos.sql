-- RLS permissivo para desenvolvimento (sem autenticação ainda)
ALTER TABLE lancamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_lancamentos" ON lancamentos
    FOR ALL
    USING (true)
    WITH CHECK (true);
