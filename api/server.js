const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/api/comentarios', require('./comentarios.js'));

app.listen(3000, () => console.log('Servidor rodando'));