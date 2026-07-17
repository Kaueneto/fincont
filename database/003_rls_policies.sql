
-- POLICIES PERMISSIVAS PRA DESENV. SEM AUTENTICACAO AINDA. SERAO RESTRIGINDAS QUANDO LOGIN FOR IMPLEMENTADO
-- grupos
ALTER TABLE grupos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_grupos" ON grupos
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- contas_gerenciais
ALTER TABLE contas_gerenciais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_contas_gerenciais" ON contas_gerenciais
    FOR ALL
    USING (true)
    WITH CHECK (true);
