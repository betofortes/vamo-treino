# Workout

PWA mobile-first para acompanhamento pessoal de musculação e corrida.

Além do plano semanal inicial, a área **Treinos** permite criar modelos personalizados escolhendo exercícios da biblioteca ou cadastrando novos, com séries, repetições, unidade de carga, RIR, aquecimento, cardio e data de uso.

Na seção **Corrida**, a velocidade da esteira pode ser registrada em km/h. O último valor é lembrado automaticamente no treino seguinte e também aparece no histórico.

## Recursos principais

- Ficha atual única, organizada por treinos e dias da semana.
- Abertura e edição individual de cada treino, incluindo exercícios, séries, repetições, carga sugerida, observações, descanso e ordem.
- Criação de uma ficha completa com 1 a 7 treinos e confirmação antes de substituir a ficha anterior.
- Cronômetro geral persistente e cronômetros independentes de intervalo para cada exercício.
- Registro de alongamento/mobilidade, tempo total, distância e velocidade da esteira no histórico.
- Transferência gratuita dos dados entre navegadores por exportação e importação de backup.

## Executar localmente

Sirva esta pasta por HTTP e abra o endereço fornecido no navegador. O aplicativo não possui dependências de instalação ou etapa de compilação.

Exemplo com Python:

```powershell
python -m http.server 4173
```

Depois, acesse `http://localhost:4173`.

## Dados

Os registros ficam no armazenamento local do navegador. A tela Progresso permite exportar e importar um backup em JSON, mantendo a operação sem banco de dados e sem mensalidade.

Como navegadores diferentes não compartilham o mesmo armazenamento local, para trocar de navegador exporte os dados no navegador de origem e importe o arquivo no navegador de destino.

## Publicação gratuita

O projeto está preparado para GitHub Pages. Depois de enviar os arquivos para um repositório público no GitHub:

1. Abra **Settings > Pages** no repositório.
2. Em **Source**, escolha **Deploy from a branch**.
3. Selecione a branch **main**, a pasta **/(root)** e salve.

O endereço gratuito terá o formato `https://usuario.github.io/repositorio/`.
