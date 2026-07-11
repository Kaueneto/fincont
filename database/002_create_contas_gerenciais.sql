CREATE TABLE contas_gerenciais (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    grupo_id BIGINT NOT NULL,

    codigo VARCHAR(10) NOT NULL UNIQUE,

    descricao VARCHAR(100) NOT NULL,

    ativo BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_conta_grupo
        FOREIGN KEY (grupo_id)
        REFERENCES grupos(id)
        ON DELETE RESTRICT
);