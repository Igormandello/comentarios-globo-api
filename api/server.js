const request = require('request');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/api/comentarios', async (req, res) => {
  var options = { 
    method: 'GET',
    url: 'https://comentarios.globo.com/comentarios/%40%40jornalismo%40%40g1%40%40economia/multi-content%40%403f0a93e3-bff8-4071-ad4c-c917d9a93099/https%3A%40%40%40%40g1.globo.com%40%40economia%40%40noticia%40%40producao-industrial-recua-109-em-maio-diz-ibge.ghtml/shorturl/Greve%20dos%20caminhoneiros%20faz%20produ%C3%A7%C3%A3o%20industrial%20recuar%2010%2C9%25%20em%20maio%2C%20diz%20IBGE/1.json',
  };

  let promise = new Promise(resolve => {
    //A globo fez com que o retorno da api de comentários fosse uma chamada de uma função com esse nome
    //Era possível fazer apenas um "substring", mas vamos jogar o jogo deles né
    function __callback_listacomentarios(json) {
      let textos = [];
      json.itens.forEach(comentario => {
        let respostas = [];
        comentario.replies.forEach(resposta => respostas.push(resposta.texto));
        textos.push({ mensagem: comentario.texto, respostas: respostas});
      });

      resolve(textos);
    }

    //Como no body vem uma chamada de função, vamos executa-la com eval
    request(options, function (error, response, body) {
      eval(body);
    });
  });

  res.json(await promise);
});

app.listen(3000, () => console.log('Servidor rodando'));