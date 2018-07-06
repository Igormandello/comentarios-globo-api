const router = require('express').Router();
const htmlparser = require("htmlparser2");
const request = require('request');
const FeedParser = require('feedparser');

const TAGS = {
  TODAS: 0,
  BRASIL: 1,
  CARROS: 2,
  CIENCIA_SAUDE: 3,
  ECONOMIA: 4,
  EDUCACAO: 5,
  LOTERIAS: 6,
  MUNDO: 7,
  PLANETA_BIZARRO: 8,
  POLITICA: 9,
  MENSALAO: 10,
  POP_ARTE: 11,
  TECNOLOGIA: 12,
  TURISMO_VIAGEM: 13
};

const FEEDS = [
  'http://pox.globo.com/rss/g1/',
  'http://pox.globo.com/rss/g1/brasil/',
  'http://pox.globo.com/rss/g1/carros/',
  'http://pox.globo.com/rss/g1/ciencia-e-saude/',
  'http://pox.globo.com/rss/g1/economia/',
  'http://pox.globo.com/rss/g1/educacao/',
  'http://pox.globo.com/rss/g1/loterias/',
  'http://pox.globo.com/rss/g1/mundo/',
  'http://pox.globo.com/rss/g1/planeta-bizarro/',
  'http://pox.globo.com/rss/g1/politica/',
  'http://pox.globo.com/rss/g1/politica/mensalao/',
  'http://pox.globo.com/rss/g1/pop-arte/',
  'http://pox.globo.com/rss/g1/tecnologia/',
  'http://pox.globo.com/rss/g1/turismo-e-viagem/',
];

//Leitura do rss para a coleta de todas as últimas notícias
var feeds = [];
FEEDS.forEach((feed, i) => {
  feeds.push([]);

  let parser = new FeedParser();
  parser.on('readable', function () {
    let item = this.read();
    while (item) {
      feeds[i].push(item['rss:guid']['#']);
      item = this.read();
    }
  });

  request.get(feed).pipe(parser);
});

//Pegas todos os comentários por ordem de popularidade
router.get(['/populares', '/:categoria/populares'], async (req, res) => {
  //Formato específicado no próprio código da globo
  let urlComentarios = 'https://comentarios.globo.com/comentarios/{uri}/{idExterno}/{url}/{shorturl}/{titulo}/populares/{pagina}.json',
      urlNoticia = chooseUrl(req.params.categoria);

  res.json(await getComments(urlNoticia, urlComentarios));
});

//Pegar todos os comentários por ordem de postagem
router.get(['/', '/:categoria'], async (req, res) => {
  //Formato específicado no próprio código da globo
  let urlComentarios = 'https://comentarios.globo.com/comentarios/{uri}/{idExterno}/{url}/{shorturl}/{titulo}/{pagina}.json',
      urlNoticia = chooseUrl(req.params.categoria);

  res.json(await getComments(urlNoticia, urlComentarios));
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

function getComments(urlNoticia, urlComentarios) {
  return new Promise(async resolve => {
    let settings = await getSettings(urlNoticia);
    
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

      if (json.itens.length < 25) {
        //Retorna um objeto que contém o título da notícia, o total de comentários e os comentários
        let titulo = settings.TITLE;
        resolve({ titulo, total, comentarios });
      } else {
        pagina++;
        requestUrl = urlComentarios.replace('{pagina}', pagina);
        request.get(requestUrl, (error, response, body) => eval(body));
      }
    }
  });
}

function chooseUrl(categoria) {
  let feed = feeds[0];
  if (categoria && TAGS[categoria.toUpperCase()] !== undefined)
    feed = feeds[TAGS[categoria.toUpperCase()]];

  return feed[Math.floor(Math.random() * Math.floor(feed.length))];
}

module.exports = router;