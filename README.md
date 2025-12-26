# Code Injection

Uma extensão poderosa para navegadores baseados em Chromium que permite injetar código JavaScript personalizado em qualquer site da web. Desenvolvida para desenvolvedores, testadores e usuários avançados que precisam modificar ou estender o comportamento de páginas web.

## 📋 Descrição

**Code Injection** é uma extensão (Manifest V3) compatível com diversos navegadores que oferece uma interface completa para criar, gerenciar e executar scripts JavaScript personalizados em sites específicos. Com um editor de código avançado, sistema de sincronização e múltiplos métodos de injeção, esta ferramenta é ideal para:

- **Desenvolvedores**: Testar modificações em sites sem precisar editar o código-fonte
- **Testadores**: Criar scripts de automação e testes personalizados
- **Usuários Avançados**: Personalizar a experiência de navegação em qualquer site
- **Pesquisadores**: Analisar e modificar o comportamento de páginas web

## ✨ Funcionalidades

### 🎯 Injeção de Código
- **Execução Automática**: Scripts são injetados automaticamente quando você visita um site correspondente
- **Execução Manual**: Controle total sobre quando executar seus scripts
- **Múltiplos Métodos de Injeção**: Sistema robusto com fallbacks para garantir que o código seja executado mesmo em sites com políticas de segurança restritivas (CSP)
- **Suporte a Wildcards**: Use padrões como `*.example.com` para aplicar scripts a múltiplos subdomínios

### 📝 Editor de Código
- **CodeMirror Integration**: Editor de código profissional com syntax highlighting
- **Autocompletar**: Sugestões inteligentes de código JavaScript (pode ser habilitado/desabilitado)
- **Formatação de Código**: Formate seu código automaticamente com um clique
- **Numeração de Linhas**: Facilita a navegação em scripts longos
- **Temas**: Modo claro e escuro (Monokai) para melhor experiência visual

### 🗂️ Gerenciamento de Scripts
- **Interface de Gerenciamento**: Visualize todos os seus scripts em uma tabela organizada
- **Busca e Filtros**: Encontre rapidamente scripts por nome ou domínio
- **Ativar/Desativar**: Controle quais scripts estão ativos sem precisar deletá-los
- **Edição Rápida**: Edite scripts diretamente do popup ou abra o editor completo
- **Histórico**: Veja quando cada script foi criado e atualizado

### 🔄 Sincronização
- **Sincronização de Dados**: Sincronize seus scripts entre diferentes dispositivos usando a sincronização do navegador
- **Sincronização Automática**: Mantenha seus dados atualizados automaticamente
- **Sincronização Manual**: Force uma sincronização quando necessário
- **Status de Sincronização**: Monitore o status e o tempo até a próxima sincronização

### 💾 Backup e Restauração
- **Exportação**: Exporte todos os seus scripts para um arquivo JSON
- **Importação**: Restaure scripts de um backup anterior
- **Limpeza**: Remova todos os scripts de uma vez (com confirmação)

### 🎨 Personalização
- **Tema Escuro/Claro**: Alternância fácil entre temas
- **Preferências Persistidas**: Suas configurações são salvas automaticamente

## 🚀 Instalação

### Instalação Manual

1. **Clone ou baixe este repositório**
   ```bash
   git clone https://github.com/seu-usuario/code-injection-js.git
   cd code-injection-js
   ```

2. **Abra seu navegador e vá para Extensões**
   - **Chrome/Edge/Brave**: Digite `chrome://extensions/` na barra de endereços
   - **Opera**: Digite `opera://extensions/` na barra de endereços
   - Ou vá em Menu → Mais ferramentas → Extensões

3. **Ative o Modo do Desenvolvedor**
   - No canto superior direito, ative o toggle "Modo do desenvolvedor"

4. **Carregue a Extensão**
   - Clique em "Carregar sem compactação" (ou "Load unpacked")
   - Selecione a pasta do projeto (`code-injection-js`)

5. **Pronto!**
   - A extensão estará instalada e pronta para uso
   - Procure pelo ícone na barra de ferramentas do navegador

## 📖 Como Usar

### Criando um Script

1. **Pelo Popup**:
   - Clique no ícone da extensão na barra de ferramentas
   - Clique em "Adicionar Script" ou "Criar Script"
   - Digite o domínio do site (ex: `example.com` ou `*.example.com`)
   - Escreva seu código JavaScript
   - Salve o script

2. **Pelo Gerenciador**:
   - Abra o popup e clique em "Gerenciar Scripts"
   - Clique em "Adicionar Novo"
   - Preencha os campos e salve

### Editando um Script

- **Pelo Popup**: Clique em "Editar Script" quando estiver em um site com script ativo
- **Pelo Gerenciador**: Clique no botão "Editar" na tabela de scripts
- **Direto no Popup**: Use o editor inline para edições rápidas

### Configurando Execução

- **Automática**: O script será executado automaticamente quando você visitar o site
- **Manual**: O script só será executado quando você clicar no botão "Executar Manualmente"

### Gerenciando Scripts

- **Ativar/Desativar**: Use o toggle na tabela de scripts ou no popup
- **Buscar**: Digite na barra de busca para filtrar scripts
- **Excluir**: Clique no botão "Excluir" (com confirmação)

## 🛠️ Estrutura do Projeto

```
code-injection-js/
├── background.js          # Service Worker (lógica principal de injeção)
├── popup.html/js          # Interface do popup
├── editor.html/js         # Editor completo de scripts
├── manager.html/js        # Gerenciador de scripts
├── options.html/js        # Página de opções/configurações
├── sync.js                # Sistema de sincronização
├── manifest.json          # Manifesto da extensão
├── injected-scripts/      # Scripts injetados nas páginas
│   ├── injector.js        # Script auxiliar de injeção
│   └── executor.js        # Executor de scripts
├── lib/                   # Bibliotecas externas
│   └── codemirror/        # Editor CodeMirror
└── images/                # Ícones e imagens
```

## 🔧 Tecnologias Utilizadas

- **Manifest V3**: Versão mais recente da API de extensões
- **CodeMirror**: Editor de código JavaScript
- **Storage API**: Armazenamento local e sincronização
- **Scripting API**: Injeção de scripts em páginas web
- **Vanilla JavaScript**: Sem dependências externas pesadas

## 🔒 Segurança e Privacidade

- **Armazenamento Local**: Seus scripts são armazenados localmente no navegador
- **Sem Telemetria**: A extensão não coleta ou envia dados para servidores externos
- **Sincronização Opcional**: A sincronização é opcional e controlada pelo usuário
- **Permissões Mínimas**: A extensão solicita apenas as permissões necessárias para funcionar

## ⚠️ Avisos Importantes

- **Use com Responsabilidade**: Injetar código em sites pode modificar seu comportamento de forma inesperada
- **Teste Antes**: Sempre teste seus scripts em ambientes seguros antes de usar em produção
- **Backup Regular**: Faça backups regulares dos seus scripts usando a função de exportação
- **Compatibilidade**: Alguns sites com políticas de segurança muito restritivas podem bloquear a injeção

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

