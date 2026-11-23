# CRM Serpa

CRM pessoal para vender serviços digitais. Etapa 1: leads, funil em kanban, serviços, histórico de contato e lembretes.

Stack: Next.js 15 + Supabase (banco e login) + Tailwind. Tudo roda no plano gratuito.

## Configurar (uma vez)

1. Crie uma conta em https://supabase.com e um projeto novo (plano Free).
2. No projeto, abra **SQL Editor**, cole o conteúdo de `supabase/schema.sql` e clique em Run.
3. Em **Project Settings > API**, copie a *Project URL* e a *anon public key*.
4. Na pasta do projeto, copie `.env.example` para `.env.local` e preencha as duas variáveis.
5. Opcional: em **Authentication > Sign In / Providers > Email**, desligue "Confirm email" para não precisar confirmar o cadastro por e-mail.

## Rodar no computador

```bash
npm install
npm run dev
```

Abra http://localhost:3000, clique em "Primeiro acesso? Criar conta" e cadastre seu e-mail e senha.
Depois do seu cadastro, você pode desligar novos cadastros em **Authentication > Sign In / Providers** ("Allow new users to sign up") para ninguém mais criar conta.

## Publicar grátis (opcional)

Suba a pasta para um repositório no GitHub, importe na https://vercel.com e cadastre as mesmas duas variáveis de ambiente.

## Telas

- **Hoje**: resumo do funil e retornos do dia ou atrasados.
- **Funil**: kanban com arrastar e soltar (no celular, use o seletor do card).
- **Leads**: lista com busca e filtros, cadastro manual. Cada lead tem botões de WhatsApp, Instagram e Facebook, histórico de contato e lembretes.
- **Buscar**: procura negócios por cidade e categoria no OpenStreetMap (grátis), mostra quem não tem site e importa como lead sem duplicar.
- **Captura rápida** (em Hoje e Leads): cole o link do Instagram, Facebook, WhatsApp ou um @ e o lead é criado em segundos, com aviso se já existir.
- **Abordagem** (na página do lead): escolha o serviço e a mensagem pronta aparece; botões abrem o WhatsApp com o texto ou copiam e abrem o direct/Messenger, registrando o contato no histórico.
- **Serviços**: seus serviços com preço e mensagem pronta de abordagem (usada na etapa 3).
