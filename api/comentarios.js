const router = require('express').Router();
const htmlparser = require("htmlparser2");
const request = require('request');
const FeedParser = require('feedparser');

//Leitura do rss para a coleta de todas as últimas notícias
var urls = [], fp = new FeedParser();
fp.on('readable', function () {
  let item = this.read();
  while (item) {
    urls.push(item['rss:guid']['#']);
    item = this.read();
  }
});

//Politica porque é o mais polêmico, logo, com os comentários mais engraçados
request.get('http://pox.globo.com/rss/g1/politica/').pipe(fp);

//Pegas todos os comentários por ordem de popularidade
router.get(['/populares', '/:categoria/populares'], async (req, res) => {
  //Formato específicado no próprio código da globo
  let urlComentarios = 'https://comentarios.globo.com/comentarios/{uri}/{idExterno}/{url}/{shorturl}/{titulo}/populares/{pagina}.json',
  urlNoticia = urls[Math.floor(Math.random() * Math.floor(urls.length))];

  res.json(await getComments(urlNoticia, urlComentarios));
});

//Pegar todos os comentários por ordem de postagem
router.get(['/', '/:categoria'], async (req, res) => {
  //Formato específicado no próprio código da globo
  let urlComentarios = 'https://comentarios.globo.com/comentarios/{uri}/{idExterno}/{url}/{shorturl}/{titulo}/{pagina}.json',
      urlNoticia = urls[Math.floor(Math.random() * Math.floor(urls.length))];

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

module.exports = router;