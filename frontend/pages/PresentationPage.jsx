import { useState } from 'react';
import '../styles/presentation.css';

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
      'Geração instantânea de credenciais de rede para convidados',
      'Interface pública simples para registo sem necessidade de login',
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
      'Frontend: React 18 + Vite para interface extremamente rápida',
      'Backend: FastAPI + Python 3.12 para processamento assíncrono',
      'Base de Dados: PostgreSQL para armazenamento seguro e performance',
      'Containerização: Docker e Docker Compose para implantação',
      'API RESTful com autenticação segura e encriptação de senhas',
      'Integração em tempo real com webhooks do ExtremeCloudIQ'
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

  return (
    <div className="presentation-container">
      <div className="presentation-slide">
        <div className="slide-content">
          <h1 className="slide-title">{slide.title}</h1>
          {slide.subtitle && <h2 className="slide-subtitle">{slide.subtitle}</h2>}
          
          {slide.content && (
            <ul className="slide-list">
              {slide.content.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          )}
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
