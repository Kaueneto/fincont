CREATE TYPE lancamento_tipo AS ENUM ('pagar', 'receber');
CREATE TYPE lancamento_status AS ENUM ('aberto', 'pago', 'recebido', 'cancelado');

CREATE TABLE lancamentos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    descricao           VARCHAR(200) NOT NULL,

    conta_gerencial_id  BIGINT NOT NULL,

    valor               NUMERIC(15, 2) NOT NULL,

    tipo                lancamento_tipo NOT NULL,

    status              lancamento_status NOT NULL DEFAULT 'aberto',

    data_lancamento     DATE NOT NULL DEFAULT CURRENT_DATE,

    data_vencimento     DATE,

    data_pagamento      DATE,

    valor_pago          NUMERIC(15, 2),

    historico           TEXT,

    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_lancamento_conta
        FOREIGN KEY (conta_gerencial_id)
        REFERENCES contas_gerenciais(id)
        ON DELETE RESTRICT
);

-- Índices para os filtros mais usados
CREATE INDEX idx_lancamentos_data_lancamento    ON lancamentos (data_lancamento);
CREATE INDEX idx_lancamentos_data_vencimento    ON lancamentos (data_vencimento);
CREATE INDEX idx_lancamentos_tipo               ON lancamentos (tipo);
CREATE INDEX idx_lancamentos_status             ON lancamentos (status);
CREATE INDEX idx_lancamentos_conta_gerencial_id ON lancamentos (conta_gerencial_id);
