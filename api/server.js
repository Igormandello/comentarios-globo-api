const htmlparser = require("htmlparser2");
const request = require('request');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/api/comentarios', async (req, res) => {
  var options = { 
    method: 'GET',
    url: 'https://g1.globo.com/economia/noticia/producao-industrial-recua-109-em-maio-diz-ibge.ghtml'
  };

  let promise = new Promise(resolve => {
    request(options, (error, response, body) => {
      //Pega a tag script com id="SETTINGS", que possui os dados necessários para a requisição em comentarios.globo.com
      let open = false, settings = '';
      let parser = new htmlparser.Parser({
        onopentag: function(name, attribs) {
          if(name === 'script' && attribs.id == 'SETTINGS')
            open = true;
        },
        ontext: function(text) {
          if (open)
            settings += text;
        },
        onclosetag: function(tagname) {
          if(tagname === "script")
            open = false;
        }
      }, { decodeEntities: true });
      parser.write(body);
      parser.end();

      //Do código nessa string, precisamos apenas do objeto SETTINGS
      settings = "var " + settings.substring(settings.search("SETTINGS = {"));
      eval(settings);

      //Agora possuimos uma referência para o objeto SETTINGS
      //console.log(SETTINGS);

      //Formato específicado no próprio código da globo
      options.url = 'https://comentarios.globo.com/comentarios/{uri}/{idExterno}/{url}/{shorturl}/{titulo}/{pagina}.json';

      //Criação da url para request de comentários (o porquê da globo trocar '/' por '@@' eu não sei, apenas aceite)
      let uri = encodeURIComponent(SETTINGS.COMENTARIOS_URI.replace(/\//g, '@@')),
          id  = encodeURIComponent(SETTINGS.COMENTARIOS_IDEXTERNO.replace(/\//g, '@@')),
          url = encodeURIComponent(SETTINGS.CANONICAL_URL.replace(/\//g, '@@')),
          shorturl = 'shorturl', //???
          titulo   = encodeURIComponent(SETTINGS.TITLE.replace(/\//g, '@@')),
          pagina   = 1; //Por enquanto

      options.url = options.url.replace('{uri}', uri);
      options.url = options.url.replace('{idExterno}', id);
      options.url = options.url.replace('{url}', url);
      options.url = options.url.replace('{shorturl}', shorturl);
      options.url = options.url.replace('{titulo}', titulo);
      options.url = options.url.replace('{pagina}', pagina);

      //Como no body vem uma chamada de função, vamos executa-la com eval
      request(options, (error, response, body) => eval(body));

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
    });
  });

  res.json(await promise);
});

app.listen(3000, () => console.log('Servidor rodando'));