# Sistema de gestão financeira

Sistema web para controle financeiro pessoal desenvolvido como projeto de estudo. O objetivo foi construir uma aplicação full stack utilizando React, Node.js e PostgreSQL, permitindo o gerenciamento de receitas e despesas, organização por grupos e contas gerenciais e acompanhamento de indicadores financeiros por meio de um dashboard.
<p align="center">
  <img src="https://github.com/user-attachments/assets/67f5529d-8934-459d-99f1-a717f17b10f0" width="32%" alt="Dashboard" />
  <img src="https://github.com/user-attachments/assets/fd37ad42-d483-45d4-9ccd-d4caa79404d5" width="32%" alt="Lançamentos" />
  <img src="https://github.com/user-attachments/assets/761f4157-4860-4336-b369-0c17161490ac" width="32%" alt="Contas Gerenciais" />
</p>

## Funcionalidades

- Dashboard com resumo de receitas, despesas e saldo previsto
- Gráficos para acompanhamento da movimentação financeira
- Cadastro de grupos e contas gerenciais
- Cadastro de lançamentos de contas a pagar e receber
- Filtros por período, tipo, conta gerencial e status
- Baixa e exclusão de lançamentos em lote
- Organização de contas utilizando drag-and-drop
- Date Picker personalizado com digitação, calendário e atalhos rápidos
- Interface responsiva

## Tecnologias utilizadas

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Recharts
- React Day Picker
- dnd-kit
- Lucide React

### Backend

- Node.js
- Express
- TypeScript

### Banco de dados

- PostgreSQL
- Supabase


O projeto está dividido em três partes:

- **Frontend:** interface da aplicação desenvolvida em React.
- **Backend:** API responsavel pelas regras de negócio e comunicação com o banco de dados.
- **Database:** scripts SQL para criação e configuração da estrutura do banco.

## Modelo de dados

```text
grupos
    └── contas_gerenciais
            └── lancamentos
```

Cada lançamento pertence a uma conta gerencial, e cada conta gerencial pertence a um grupo.

