const router = require('express').Router();
const htmlparser = require("htmlparser2");
const request = require('request');

router.get('/', async (req, res) => {
  let requestUrl = 'https://g1.globo.com/rs/rio-grande-do-sul/noticia/tribunal-federal-mantem-sergio-moro-nos-processos-do-sitio-de-atibaia-e-do-instituto-lula.ghtml'
  let settings = await getSettings(requestUrl);

  //Formato específicado no próprio código da globo
  let urlComentarios = 'https://comentarios.globo.com/comentarios/{uri}/{idExterno}/{url}/{shorturl}/{titulo}/{pagina}.json';

  res.json(await getComments(urlComentarios, settings));
});

function getSettings(url) {
  return new Promise(resolve =>
    request.get(url, (error, response, body) => {
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
      resolve(SETTINGS);
    })
  );
}

function getComments(urlComentarios, settings) {
  return new Promise(resolve => {
    //Criação da url para request de comentários (o porquê da globo trocar '/' por '@@' eu não sei, apenas aceite)
    let uri = encodeURIComponent(settings.COMENTARIOS_URI.replace(/\//g, '@@')),
        id  = encodeURIComponent(settings.COMENTARIOS_IDEXTERNO.replace(/\//g, '@@')),
        url = encodeURIComponent(settings.CANONICAL_URL.replace(/\//g, '@@')),
        shorturl = 'shorturl', //???
        titulo   = encodeURIComponent(settings.TITLE.replace(/\//g, '@@')),
        pagina   = 1;

    urlComentarios = urlComentarios.replace('{uri}', uri);
    urlComentarios = urlComentarios.replace('{idExterno}', id);
    urlComentarios = urlComentarios.replace('{url}', url);
    urlComentarios = urlComentarios.replace('{shorturl}', shorturl);
    urlComentarios = urlComentarios.replace('{titulo}', titulo);
    requestUrl = urlComentarios.replace('{pagina}', pagina);

    //Como no body vem uma chamada de função, vamos executa-la com eval
    request.get(requestUrl, (error, response, body) => eval(body));

    let comentarios = [], total = 0;
    //A globo fez com que o retorno da api de comentários fosse uma chamada de uma função com esse nome
    //Era possível fazer apenas um "substring", mas vamos jogar o jogo deles né
    function __callback_listacomentarios(json) {
      json.itens.forEach(comentario => {
        let respostas = [];
        comentario.replies.forEach(resposta => respostas.push(resposta.texto));
        comentarios.push({ mensagem: comentario.texto, respostas: respostas});

        total += 1 + comentario.replies.length;
      });

      if (json.itens.length < 25)
        resolve({ comentarios, total });
      else {
        pagina++;
        requestUrl = urlComentarios.replace('{pagina}', pagina);
        request.get(requestUrl, (error, response, body) => eval(body));
      }
    }
  });
}

module.exports = router;