import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import projectsRouter from './routes/projects.js';
import { FONTS, fontsDir } from './services/styles.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/fonts', (req, res) => {
  res.json(FONTS.map(({ name, file, group }) => ({ name, file, group })));
});
app.use('/api/fontfiles', express.static(fontsDir));

app.use('/api/projects', projectsRouter);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log('Server running on http://localhost:' + port);
});