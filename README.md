# 📱 True iPhones System

> **Sistema Web Corporativo de Gestão Financeira, Recibos, Estoque e Clientes**  
> Aplicação profissional em produção e utilizada ativamente pelo cliente **True iPhones**, projetada para otimizar vendas, controle de garantias, catálogo de produtos e fluxo de caixa.

---

## 📋 Sobre o Projeto

O **True iPhones System** é uma plataforma ERP/CRM sob medida desenvolvida para simplificar e profissionalizar a operação diária da True iPhones. O sistema centraliza o gerenciamento de estoque, cadastro de clientes, emissão/controle de recibos de vendas e métricas financeiras.

### 🔐 Controle de Acessos e Níveis de Permissão

A aplicação conta com um sistema de controle de acessos (RBAC - *Role-Based Access Control*) que diferencia a navegação de acordo com o nível do usuário:

* **🛡️ Lado do Administrador (Admin):**
  * Acesso completo a todas as funcionalidades do sistema.
  * **Dashboard Financeiro (Início):** Visualização de quantidade de vendas, receita total, custo total, lucro bruto, lucro líquido (descontando taxas de cartão/débito), média de garantias e gráficos por forma de pagamento.
  * **Gestão de Funcionários:** Cadastro, edição e controle de usuários e permissões da equipe.
  * Gestão completa de Clientes, Produtos e Recibos.

* **👤 Lado do Funcionário / Vendedor:**
  * Visão restrita e operacional focada na rotina diária de atendimento.
  * **Ocultação do Dashboard Financeiro:** O vendedor não visualiza margens de lucro, relatórios consolidados do painel ou dados financeiros estratégicos da empresa.
  * **Menu Simplificado:** Acesso restrito a Clientes, Produtos e emissão de Recibos de Vendas.

---

## 📸 Demonstração do Sistema

### 📊 Painel Geral & Analytics (Visão Administrador)

#### 1. Dashboard Financeiro (`Início`)
Exibição detalhada dos KPIs financeiros com filtros por período de datas, balanço de lucros descontando taxas operacionais e gráfico comparativo por forma de pagamento.
<img width="950" height="454" alt="image" src="https://github.com/user-attachments/assets/a4e15ec8-9185-4368-a805-838883158abd" />

---

### 👥 Gestão de Clientes

#### 2. Lista de Clientes Cadastrados
Tabela com busca rápida por nome, exibindo dados de contato (WhatsApp/Telefone, E-mail, CPF) e data de cadastro.
<img width="1024" height="490" alt="image" src="https://github.com/user-attachments/assets/2370ea39-7ee8-4996-aaa5-b1b42278d440" />


#### 3. Cadastro de Novo Cliente
Modal para inclusão rápida de clientes com validação de campos.
<img width="225" height="194" alt="image" src="https://github.com/user-attachments/assets/560221a0-2247-4283-ac63-d4de567efad5" />

#### 4. Visão do Funcionário (Menu de Clientes Restrito)
Interface limpa exibida para vendedores (sem acesso às abas de "Início" e "Funcionários").
<img width="1656" height="256" alt="image" src="https://github.com/user-attachments/assets/e35b1578-dd33-42f7-8ddf-e85d93efe320" />


---

### 📦 Gestão de Produtos e Estoque

#### 5. Catálogo de Produtos
Listagem de produtos em estoque contendo código identificador, memória/tamanho, cor, preço de venda e ações de edição/remoção.
<img width="953" height="278" alt="image" src="https://github.com/user-attachments/assets/a5d712d7-38d6-4a14-8e6b-b61ed68af85f" />


#### 6. Cadastro de Produto
Modal para rápida adição de novos itens ao catálogo.
<img width="227" height="227" alt="image" src="https://github.com/user-attachments/assets/97a2c47d-4b18-41e0-bc3b-6ec1b7de59c0" />

---

### 🧾 Gestão de Recibos e Vendas

#### 7. Central de Recibos Emitidos
Cards interativos que detalham recibos de venda por cliente, atendente/vendedor, custo do produto, lucro líquido gerado, forma de pagamento, tempo de garantia e atalhos rápidos para ações.
<img width="1024" height="491" alt="image" src="https://github.com/user-attachments/assets/c81c1901-f94c-4a40-8cd9-7fa576c4faba" />

#### 8. Emissão de Novo Recibo
Formulário completo de venda que calcula automaticamente o prazo de expiração da garantia, permite vínculo com funcionário/cliente, registro de IMEI do aparelho, forma de pagamento e valor final.
<img width="450" height="425" alt="image" src="https://github.com/user-attachments/assets/6927d51a-9063-4e28-b434-5219d38896db" />

---

### 👔 Gestão de Funcionários (Visão Administrador)

#### 9. Tabela de Colaboradores
Listagem da equipe ativa informando WhatsApp, idade e cargo/função (Admin / Vendedor).
<img width="953" height="454" alt="image" src="https://github.com/user-attachments/assets/d7ef1447-c478-4756-9a9c-fd3a1b9f3e47" />


#### 10. Cadastro de Funcionário
Modal para inclusão de novos membros na equipe e definição de suas permissões.
<img width="229" height="197" alt="image" src="https://github.com/user-attachments/assets/b2a68651-be9e-47f1-a2bc-60f5f545a81c" />


---

## ✨ Funcionalidades Principais

- [x] **Dashboard Financeiro Completo:** Métricas em tempo real de vendas, faturamento bruto, custos de aquisição e lucro líquido consolidado.
- [x] **Gestão de Recibos & Garantias:** Emissão rápida de vendas com acompanhamento de prazos de garantia e vinculação de IMEI.
- [x] **Gestão de Estoque:** Controle de aparelhos por capacidade de armazenamento, cor e código identificador.
- [x] **Base de Clientes (CRM):** Organização de histórico de compras e contatos de clientes.
- [x] **Níveis de Permissão (RBAC):** Proteção de dados financeiros confidenciais contra acessos não autorizados de funcionários.
- [x] **Filtros por Período:** Análise de faturamento por intervalo customizado de datas.
- [x] **Design Responsivo:** Interface otimizada para uso em computadores, tablets e smartphones na loja física.

---

## 🛠️ Tecnologias Utilizadas

O projeto utiliza uma stack moderna baseada no ecossistema **React + Vite**, garantindo um build rápido, excelente experiência do usuário e fácil manutenção:

| Categoria | Tecnologia | Descrição |
| :--- | :--- | :--- |
| **Build Tool & Bundler** | [Vite](https://vitejs.dev/) | Bundler ultrarrápido para desenvolvimento frontend ágil e otimização de build de produção. |
| **Biblioteca Web** | [React 18](https://react.dev/) | Construção de interface declarativa e baseada em componentes reativos. |
| **Linguagem** | [JavaScript / TS](https://www.typescriptlang.org/) | Desenvolvimento estruturado para lógica de negócios e UI. |
| **Backend & Banco de Dados** | [Supabase](https://supabase.com/) | Banco de dados PostgreSQL gerenciado, Autenticação, Row Level Security (RLS) e API Realtime. |
| **Estilização** | [Tailwind CSS](https://tailwindcss.com/) | Framework
