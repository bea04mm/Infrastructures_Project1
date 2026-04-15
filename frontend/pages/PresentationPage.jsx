import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import '../styles/presentation.css';

mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'loose',
  theme: 'default'
});

function MermaidChart({ chart, chartKey }) {
  const containerRef = useRef(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const renderChart = async () => {
      if (!containerRef.current) return;

      try {
        setHasError(false);
        const renderId = `mermaid-${chartKey}-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
        const { svg } = await mermaid.render(renderId, chart);
        if (isMounted && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch {
        if (isMounted) {
          setHasError(true);
          if (containerRef.current) {
            containerRef.current.innerHTML = '';
          }
        }
      }
    };

    renderChart();

    return () => {
      isMounted = false;
    };
  }, [chart, chartKey]);

  if (hasError) {
    return (
      <pre style={{ whiteSpace: 'pre-wrap', textAlign: 'left' }}>
        Não foi possível renderizar este diagrama Mermaid.
      </pre>
    );
  }

  return <div ref={containerRef} />;
}

const slides = [
  {
    title: 'Sistema de Kiosk para Eventos',
    subtitle: 'Gestão Inteligente de Eventos com Integração WiFi'
  },
  {
    title: 'O que é o Kiosk?',
    content: [
      'Sistema completo de gestão de eventos com auto-registo automático',
      'Integração com ExtremeCloudIQ para controlo de acesso WiFi',
      'Interface pública simples para registo sem necessidade de login',
      'Geração instantânea de credenciais de rede para convidados',
      'Revogação automática de acesso quando eventos terminam',
      'Dashboard de administração para gestão centralizada'
    ]
  },
  {
    title: 'Problema Resolvido',
    content: [
      'Registo manual de convidados é lento e propenso a erros',
      'Controlo de acesso WiFi requer configuração muito complexa',
      'Remoção de acesso necessita intervenção manual e demorada',
      'Experiência do convidado frequentemente frustrante e confusa',
      'Custos administrativos elevados e tempo perdido',
      'Solução: Automatização completa do ciclo de vida do evento'
    ]
  },
  {
    title: 'Tecnologias Utilizadas',
    content: [
      'Frontend: React 18 + Vite para uma interface reactiva',
      'Backend: FastAPI + Python 3.12',
      'Base de Dados: PostgreSQL para persistencia dos dados',
      'Containerização: Docker e Docker Compose',
      'API RESTful com autenticação segura e encriptação de senhas',
      'Integração em tempo real com webhooks do ExtremeCloudIQ'
    ]
  },

  /* =========================
     🔵 FLUXO 1 — MERMAID
     ========================= */
  {
    title: 'Fluxo 1 — Criação de Evento (Provisionamento WiFi)',
    content: [
      '```mermaid',
      'flowchart LR',
      'A[Admin cria evento] --> B[POST /usergroups]',
      'B --> C[Criar User Group no ExtremeCloudIQ]',
      'C --> D[GET /ssids/:ssid_id]',
      'D --> E[Ler configuração atual do SSID]',
      'E --> F[Adicionar novo user_group_id à lista]',
      'F --> G[PUT /ssids/:ssid_id/mode/ppsk]',
      'G --> H[Atualizar SSID com lista completa]',
      'H --> I[Evento ativo - convidados podem aceder]',
      '```'
    ]
  },

  /* =========================
     🔴 FLUXO 2 — MERMAID
     ========================= */
  {
    title: 'Fluxo 2 — Encerramento de Evento (Limpeza Automática)',
    content: [
      '```mermaid',
      'flowchart LR',
      'A[Evento termina] --> B[GET /ssids/:ssid_id]',
      'B --> C[Ler configuração atual]',
      'C --> D[Remover user_group_id do evento]',
      'D --> E[PUT /ssids/:ssid_id/mode/ppsk]',
      'E --> F[Atualizar SSID sem grupo do evento]',
      'F --> G[DELETE /endusers/:id]',
      'G --> H[Remover todos os convidados]',
      'H --> I[DELETE /usergroups/:id]',
      'I --> J[Acesso WiFi revogado]',
      '```'
    ]
  },

  {
    title: 'Fluxo Principal de Funcionamento',
    content: [
      'Administrador cria evento com datas e informações específicas',
      'Sistema cria automaticamente grupo de utilizadores no ExtremeCloudIQ',
      'Grupo é adicionado à configuração de acesso WiFi da rede',
      'Convidados acedem à página pública de auto-registo no Kiosk',
      'Após validação, recebem credenciais WiFi prontas para usar',
      'Ao expirar o evento, acesso é revogado e grupos eliminados'
    ]
  },
  {
    title: 'Funcionalidades Principais',
    content: [
      'Calendário com 4 visualizações: Dia, Semana, Mês e Timeline',
      'Gestão de utilizadores com diferentes níveis de permissão',
      'Limpeza automática programada para eventos expirados',
      'Interface responsiva e funcional em computador e telemóvel',
      'Integração com eventos de autenticação do ExtremeCloudIQ',
      'Histórico completo de convidados e rastreamento de acessos'
    ]
  },
  {
    title: 'Segurança e Proteção de Dados',
    content: [
      'Autenticação com tokens seguros com validade configurável',
      'Senhas protegidas com encriptação bcrypt e sal automático',
      'Validação rigorosa de todos os dados de entrada do utilizador',
      'Controlo de acesso por funções: Administrador e Utilizador',
      'Credenciais sensíveis armazenadas em variáveis de ambiente',
      'Proteção contra injeções de código e acessos não autorizados'
    ]
  },
  {
    title: 'Endpoints Disponíveis',
    content: [
      'Autenticação: registo, login e informações do utilizador',
      'Eventos: criar, listar, editar e eliminar eventos',
      'Convidados: listar convidados de cada evento',
      'Kiosk Público: registo de convidados sem autenticação',
      'Webhooks: receber eventos do sistema WiFi em tempo real',
      'Monitorização: verificação de saúde da aplicação e base de dados'
    ]
  },
  {
    title: 'Estrutura da Base de Dados',
    content: [
      'Tabela de utilizadores: contas com autenticação segura',
      'Tabela de eventos: definições e agendamentos de eventos',
      'Tabela de convidados: registo completo por evento',
      'Tabela de integrações: configurações do ExtremeCloudIQ',
      'Índices otimizados para consultas rápidas e eficientes',
      'Backup automático e recuperação de dados disponível'
    ]
  },
  {
    title: 'Implantação e Operação',
    content: [
      'Docker Compose para orquestração local e em produção',
      'Variáveis de ambiente para configuração de segurança',
      'Registos estruturados para diagnóstico e monitorização',
      'Verificações automáticas de saúde de todos os serviços',
      'Armazenamento persistente de dados com volumes Docker',
      'Pronto para implantação em servidores cloud'
    ]
  },
  {
    title: 'Benefícios e Impacto',
    content: [
      'Redução de 90% no tempo gasto no registo de convidados',
      'Eliminação de erros na configuração de acesso WiFi',
      'Experiência do utilizador fluida, rápida e intuitiva',
      'Limpeza automática elimina trabalho manual repetitivo',
      'Capacidade de gerir centenas de eventos em simultâneo',
      'Retorno de investimento rápido através da automatização'
    ]
  },
  {
    title: 'Acede ao Sistema',
    type: 'qrcode',
    qrcodeImage: '/qrcode.svg'
  }
];

export default function PresentationPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const slide = slides[currentSlide];
  const mermaidChart =
    slide.content?.[0] === '```mermaid' && slide.content?.[slide.content.length - 1] === '```'
      ? slide.content.slice(1, -1).join('\n')
      : null;

  return (
    <div className="presentation-container">
      <div className="presentation-slide">
        <div className={`slide-content ${mermaidChart ? 'slide-content--mermaid' : ''} ${slide.type === 'qrcode' ? 'slide-content--qrcode' : ''}`}>
          <h1 className="slide-title">{slide.title}</h1>
          {slide.subtitle && <h2 className="slide-subtitle">{slide.subtitle}</h2>}

          {slide.type === 'qrcode' && slide.qrcodeImage ? (
            <div className="slide-qrcode">
              <img src={slide.qrcodeImage} alt="QR Code" className="qrcode-image" />
            </div>
          ) : slide.content &&
            (mermaidChart ? (
              <div className="slide-mermaid">
                <MermaidChart chart={mermaidChart} chartKey={currentSlide} />
              </div>
            ) : (
              <ul className="slide-list">
                {slide.content.map((item, index) => (
                  <li key={index}>
                    <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
                      {item}
                    </pre>
                  </li>
                ))}
              </ul>
            ))}
        </div>
      </div>

      <div className="presentation-controls">
        <button className="nav-button" onClick={prevSlide}>
          ← Anterior
        </button>
        <span className="slide-counter">{currentSlide + 1} / {slides.length}</span>
        <button className="nav-button" onClick={nextSlide}>
          Próximo →
        </button>
      </div>
    </div>
  );
}