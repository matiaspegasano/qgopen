export default function Footer() {
  return (
    <footer className="footer">
      <div>
        <h5 className="footer-heading">QG Open</h5>
        <div style={{ fontSize: 12, lineHeight: 1.7, color: 'rgba(234,241,236,0.7)' }}>
          Campeonato amador de tênis<br />
          Alphaville · São Paulo<br />
          1ª Edição · 2026
        </div>
      </div>
      <div>
        <h5 className="footer-heading">Torneio</h5>
        <a href="#">Regulamento</a>
        <a href="#">Critérios de classificação</a>
        <a href="#">Calendário oficial</a>
        <a href="#">Sedes e quadras</a>
      </div>
      <div>
        <h5 className="footer-heading">Contato</h5>
        <a href="#">contato@qgopen.com.br</a>
        <a href="#">Imprensa</a>
        <a href="#">Patrocinadores</a>
      </div>
    </footer>
  );
}
