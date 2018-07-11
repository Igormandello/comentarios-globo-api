# Comentarios Globo API

Uma API simples para a requisição da maior maravilha da internet: Os comentários do site de notícias da Globo, o [G1](https://g1.globo.com/)

---
## Requerimentos

Para o desenvolvimento, você só precisa ter instalado em seu ambiente Node.js e um pacote global do node, o Yarn.

### Node
- #### Instalação do Node no Windows

  Basta acessar o [site oficial do Node](https://nodejs.org/) e baixar o instalador.
Além disso, tenha certeza que você possui o `git` disponível em seu PATH, pois o `npm` pode precisar dele (Você pode encontrar o git [aqui](https://git-scm.com/)).

- #### Instalação do Node no Ubuntu

  Você pode instalar o Node fácilmente com apt install, apenas rode os seguintes comandos:

      $ sudo apt install nodejs
      $ sudo apt install npm

- #### Outros sistemas operacionais
  Você pode encontrar mais informações sobre a instalação no [site oficial do Node](https://nodejs.org/) e no [site oficial do NPM](https://npmjs.org/)

Se a instalação foi concluída com êxito, você deverá ser capaz de rodar os seguintes comandos:

    $ node --version
    v8.11.3

    $ npm --version
    6.1.0

Se você precisar atualizar o `npm`, você pode fazer isso através do próprio `npm`! Legal né? Após rodar o comando a seguir, apenas abra novamente a command line e seja feliz.

    $ npm install npm -g

###
### Instalação do Yarn
  Após instalar o node, esse projeto necessitará de yarn também, então rode o seguinte comando:

      $ npm install -g yarn

---

## Instalação

    $ git clone https://github.com/Igormandello/comentarios-globo-api
    $ cd comentarios-globo-api
    $ yarn install

## Rodando o projeto
  Para rodar o servidor, basta executar o comando a seguir, ele já estará acessível em seu `localhost`, por padrão na porta 3000.

    $ yarn start

  Em ambientes de desenvolvimento, você pode rodar atrevés do nodemon para que as alterações no arquivos já reinicializem o servidos, para isso, troque o comando `start` por `watch`:

    $ yarn watch

---
## Functionalidades da API

  ### Recursos
   - GET /api/comentarios
   - GET /api/comentarios/populares
   - GET /api/comentarios/[categoria]
   - GET /api/comentarios/[categoria]/populares

  Todos os endpoints válidos da API retornam o mesmo objeto, o objeto que representa uma notícia.

  #### Notícia
  | Campo | Tipo | Descrição |
  |-------|------|-----------|
  | titulo | `String` | O título da notícia em que os comentários foram retirados |
  | total | `int` | Total de comentários presentes, incluindo as respostas de comentários |
  | comentarios | `Array` | Um array formado por objetos de [comentários](#Comentários) |

  #### Comentários
  | Campo | Tipo | Descrição |
  |-------|------|-----------|
  | mensagem | `String` | A mensagem do comentário |
  | respostas | `Array` | Um array em que cada posição contém uma `String`, que é a mensagem de cada resposta do comentário atual |

  ##
  #### Exemplo de retorno válido da API:
  ```javascript
  {
    "titulo":"Comissão do Senado rejeita projeto que impõe multa de até 50% para cliente que desistir de imóvel",
    "total":5,
    "comentarios": [
      {
        "mensagem":"Setor lucrou horrores e agora que veio a crise ta em dificuldade? \n",
        "respostas":[]
      },
      {
        "mensagem":"Não importa o que sair dali, vai ser prejudicial ao consumidor.\nQuais leis estão sendo votadas para ajudar o consumidor que também esta quebrado?",
        "respostas":[]
      },
      {
        "mensagem":"Jugar está muito equivocado quando defendo esse projeto rejeitado, ainda bem que foi rejeitado, argumentando que o setor imobiliário está quebrado e que, se aprovado, aliviaria o setor. Ora,  o que falta ao setor imobiliário é financiamento imobiliário. É a Caixa Econômica quem dita o ritmo do setor imobiliário mas está descapitalizada. É preciso uma política permanente de crédito imobiliário com recursos da Poupança, do FGTS e de capital próprio da Caixa, oriundo de Lucros e de capitação de Loterias, por exemplo.\n\n\n",
        "respostas":[
          "Garantias apenas para as construtoras, os compradores q por algum motivo quiserem desfazer a compra ficam com o prejuízo ",
          "Uai, mas não é para ser liberal? Não é para o governo não se intrometer nos negócios? Então porque usar dinheiro do FGTS, do FAT, da CEF, do BNDES...??? Deixem as construtoras e incorporadoras se entenderem com o comprador, sem dinheiro ou interferência do governo e dos fundos dos trabalhadores."
        ]
      },
    ]
  }
  ```
  ### GET /api/comentarios
  Seleciona uma notícia aleatória entre todas as últimas notícias postadas e retorna seus comentários ordenados por ordem cronológica.

  ### GET /api/comentarios/populares
  Seleciona uma notícia aleatória entre todas as últimas notícias postadas e retorna seus comentários ordenados por ordem de popularidade.

  ### GET /api/comentarios/[categoria]
  Seleciona uma notícia aleatória entre as notícias da [categoria](#Categoria) especificada e retorna seus comentários ordenados por ordem cronológica. Caso a categoria não seja válida, a categoria de onde são retiradas é a geral.

  ### GET /api/comentarios/[categoria]/populares
  Seleciona uma notícia aleatória entre as notícias da [categoria](#Categoria) especificada e retorna seus comentários ordenados por ordem de popularidade. Caso a categoria não seja válida, a categoria de onde são retiradas é a geral.

  #### Categorias
  Todas as categorias a seguir podem ser passadas na url da forma que estão escritas, sem importar com maiúsculas e minúsculas.
  - Todas
  - Brasil
  - Carros
  - Ciencia_saude
  - Economia
  - Educacao
  - Loterias
  - Mundo
  - Planeta_bizarro
  - Politica 
  - Mensalao
  - Pop_arte
  - Tecnologia
  - Turismo_viagem