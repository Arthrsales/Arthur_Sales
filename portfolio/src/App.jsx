import { useState, useEffect, useRef } from 'react'
import './index.css'
import './App.css'

// ── Hook: scroll reveal ──────────────────────────────────────────────────────
function useReveal(threshold = 0.15) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect() }
    }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, visible]
}

// ── Partículas de fundo ──────────────────────────────────────────────────────
function Particles() {
  const canvas = useRef(null)
  useEffect(() => {
    const c = canvas.current, ctx = c.getContext('2d')
    let W = c.width = window.innerWidth, H = c.height = window.innerHeight
    const pts = Array.from({length: 60}, () => ({
      x: Math.random()*W, y: Math.random()*H,
      vx: (Math.random()-.5)*.3, vy: (Math.random()-.5)*.3,
      r: Math.random()*1.5+.5
    }))
    let raf
    const draw = () => {
      ctx.clearRect(0,0,W,H)
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if(p.x<0||p.x>W) p.vx*=-1
        if(p.y<0||p.y>H) p.vy*=-1
        ctx.beginPath()
        ctx.arc(p.x,p.y,p.r,0,Math.PI*2)
        ctx.fillStyle = 'rgba(108,99,255,0.5)'
        ctx.fill()
      })
      pts.forEach((a,i) => pts.slice(i+1).forEach(b => {
        const d = Math.hypot(a.x-b.x,a.y-b.y)
        if(d<120){
          ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y)
          ctx.strokeStyle = `rgba(108,99,255,${.15*(1-d/120)})`
          ctx.stroke()
        }
      }))
      raf = requestAnimationFrame(draw)
    }
    draw()
    const resize = () => { W=c.width=window.innerWidth; H=c.height=window.innerHeight }
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize',resize) }
  }, [])
  return <canvas ref={canvas} style={{position:'fixed',top:0,left:0,zIndex:0,pointerEvents:'none',opacity:.6}} />
}

// ── Cursor piscando ──────────────────────────────────────────────────────────
function TypewriterHero({lines}) {
  const [displayed, setDisplayed] = useState('')
  const [lineIdx, setLineIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (done) return
    const current = lines[lineIdx]
    if (charIdx < current.length) {
      const t = setTimeout(() => {
        setDisplayed(prev => prev + current[charIdx])
        setCharIdx(c => c+1)
      }, 55)
      return () => clearTimeout(t)
    } else if (lineIdx < lines.length - 1) {
      const t = setTimeout(() => {
        setDisplayed(prev => prev + '\n')
        setLineIdx(l => l+1)
        setCharIdx(0)
      }, 400)
      return () => clearTimeout(t)
    } else { setDone(true) }
  }, [charIdx, lineIdx, done, lines])

  return (
    <pre className="typewriter">
      {displayed}<span className="cursor">|</span>
    </pre>
  )
}

// ── Barra de skill ───────────────────────────────────────────────────────────
function SkillBar({name, pct, color='var(--accent)'}) {
  const [ref, visible] = useReveal(0.3)
  return (
    <div ref={ref} className="skill-bar">
      <div className="skill-label"><span>{name}</span><span>{pct}%</span></div>
      <div className="skill-track">
        <div className="skill-fill" style={{
          '--w': `${pct}%`, background: color,
          width: visible ? `${pct}%` : '0%',
          transition: visible ? 'width 1.2s cubic-bezier(.4,0,.2,1)' : 'none'
        }} />
      </div>
    </div>
  )
}

// ── Card de experiência ──────────────────────────────────────────────────────
function ExpCard({year, role, company, desc, tags}) {
  const [ref, visible] = useReveal()
  const [hovered, setHovered] = useState(false)
  return (
    <div ref={ref} className={`exp-card ${visible?'revealed':''}`}
      onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
      style={{transform: hovered ? 'translateX(8px)' : 'translateX(0)'}}>
      <div className="exp-year">{year}</div>
      <div className="exp-body">
        <div className="exp-role">{role}</div>
        <div className="exp-company">{company}</div>
        <p className="exp-desc">{desc}</p>
        <div className="exp-tags">{tags.map(t=><span key={t} className="tag">{t}</span>)}</div>
      </div>
    </div>
  )
}

// ── Card de projeto ──────────────────────────────────────────────────────────
function ProjectCard({emoji, title, desc, tags, link}) {
  const [ref, visible] = useReveal()
  const [tilt, setTilt] = useState({x:0,y:0})
  const handleMove = e => {
    const r = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width - .5) * 14
    const y = -((e.clientY - r.top) / r.height - .5) * 14
    setTilt({x, y})
  }
  return (
    <div ref={ref} className={`project-card ${visible?'revealed':''}`}
      onMouseMove={handleMove} onMouseLeave={()=>setTilt({x:0,y:0})}
      style={{transform: `perspective(600px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`}}>
      <div className="project-emoji">{emoji}</div>
      <div className="project-title">{title}</div>
      <p className="project-desc">{desc}</p>
      <div className="exp-tags">{tags.map(t=><span key={t} className="tag">{t}</span>)}</div>
    </div>
  )
}

// ── Nav ──────────────────────────────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])
  const links = ['Sobre','Habilidades','Experiência','Projetos','Contato']
  return (
    <nav className={`nav ${scrolled?'nav-scrolled':''}`}>
      <div className="nav-logo">AS<span className="dot">.</span></div>
      <div className={`nav-links ${open?'open':''}`}>
        {links.map(l => (
          <a key={l} href={`#${l.toLowerCase().replace('ê','e').replace('õ','o')}`}
            onClick={()=>setOpen(false)}>{l}</a>
        ))}
      </div>
      <button className="hamburger" onClick={()=>setOpen(o=>!o)}>
        <span/><span/><span/>
      </button>
    </nav>
  )
}

// ── Seção wrapper ────────────────────────────────────────────────────────────
function Section({id, children, className=''}) {
  const [ref, visible] = useReveal(0.1)
  return (
    <section id={id} ref={ref} className={`section ${visible?'revealed':''} ${className}`}>
      {children}
    </section>
  )
}

function SectionTitle({eyebrow, title}) {
  return (
    <div className="section-header">
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="section-title">{title}</h2>
    </div>
  )
}

// ── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText('arthur@email.com')
    setCopied(true)
    setTimeout(()=>setCopied(false), 2000)
  }

  return (
    <>
      <Particles />
      <Nav />

      {/* ── HERO ── */}
      <section id="sobre" className="hero">
        <div className="hero-inner">
          <div className="hero-badge">✦ Disponível para oportunidades</div>
          <h1 className="hero-name">Arthur<br/><span className="hero-name-accent">Sales</span></h1>
          <TypewriterHero lines={[
            '> Desenvolvedor Full Stack',
            '> Foco em qualidade e código limpo. ',
            '> Transformando ideias em produtos reais_'
          ]} />
          <p className="hero-sub">
            Crio experiências digitais com foco em performance, acessibilidade e design que comunica.
            Atuo do back-end ao front-end, sempre com código organizado e soluções criativas.
          </p>
          <div className="hero-ctas">
            <a href="#contato" className="btn-primary">Entrar em contato</a>
            <a href="#projetos" className="btn-ghost">Ver projetos →</a>
          </div>
          <div className="hero-stats">
            {[['20+','Semanas de exp.'],['5+','Projetos'],['2+','Clientes']].map(([n,l])=>(
              <div key={l} className="stat"><span className="stat-num">{n}</span><span className="stat-label">{l}</span></div>
            ))}
          </div>
        </div>
        <div className="hero-orb" />
        <div className="scroll-hint">↓ scroll</div>
      </section>

      {/* ── SOBRE ── */}
      <Section id="sobre-mim" className="about-section">
        <SectionTitle eyebrow="quem sou eu" title="Um pouco sobre mim" />
        <div className="about-grid">
          <div className="about-avatar">
            <div className="avatar-ring">
              <div className="avatar-inner">AS</div>
            </div>
            <div className="avatar-float">🚀</div>
          </div>
          <div className="about-text">
            <p>Sou um eterno estudante e desenvolvedor de software com <strong>buscando por experiência</strong> mas sempre construindo aplicações web modernas. Comecei programando por hobby, descobri que podia transformar problemas reais em soluções elegantes e nunca mais parei.</p>
            <p>Tenho especial interesse em <strong>performance, arquitetura de sistemas e UI/UX</strong>. Acredito que bom código e boa experiência do usuário não são opostos — são a mesma coisa vista por ângulos diferentes.</p>
            <p>Fora do computador, você me acha praticando esportes, aprendendo sobre musica ou lendo sobre investimento inteligente.</p>
            <div className="about-pills">
              {['Pensamento sistêmico','Comunicação clara','Aprendizado rápido','Trabalho em equipe','Autonomia'].map(p=>(
                <span key={p} className="pill">{p}</span>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ── HABILIDADES ── */}
      <Section id="habilidades">
        <SectionTitle eyebrow="o que sei fazer" title="Habilidades técnicas" />
        <div className="skills-grid">
          <div className="skills-col">
            <h3 className="skills-cat">Front-end</h3>
            <SkillBar name="React / Next.js" pct={65} />
            <SkillBar name="TypeScript" pct={55} />
            <SkillBar name="CSS / Tailwind" pct={80} />
            <SkillBar name="Animações & UI" pct={75} />
          </div>
          <div className="skills-col">
            <h3 className="skills-cat">Back-end</h3>
            <SkillBar name="Node.js / Express" pct={80} color="#FF6584" />
            <SkillBar name="PostgreSQL / MySQL" pct={90} color="#FF6584" />
            <SkillBar name="REST APIs" pct={50} color="#FF6584" />
            <SkillBar name="Docker / DevOps" pct={45} color="#FF6584" />
          </div>
        </div>
        <div className="tech-icons">
          {['⚛️ React','🟨 JavaScript','🐘 PHP','🐘 PostgreSQL','🐳 Docker','🌐 Node.js','🎨 Figma','☁️ AWS'].map(t=>(
            <div key={t} className="tech-chip">{t}</div>
          ))}
        </div>
      </Section>

      {/* ── EXPERIÊNCIA ── */}
      <Section id="experiencia">
        <SectionTitle eyebrow="onde estive" title="Experiência profissional" />
        <div className="exp-list">
          <ExpCard
            year="2026–presente"
            role="Desenvolvedor Full Stack "
            company="Sua empresa aqui?"
            desc="Atualmente, estou procurando a oportunidade de transformar conhecimento em experiência profissional. Quem sabe a próxima atualização deste perfil seja anunciando minha entrada na sua equipe?"
            tags={['React','Node.js','SQL','PHP']}
          />
          <ExpCard
            year="2022–2026"
            role="Assistente Administrativo"
            company="Novo Horizonte Manutenções e Serviços"
            desc="Responsável pelo suporte às atividades administrativas da empresa, incluindo organização de documentos, controle de informações, atendimento a clientes e apoio aos processos internos. "
            tags={['ERM','Office 365','Automação','Adminstração']}
          />
          <ExpCard
            year="2021–2022"
            role="Militar - Soldado"
            company="Exército Brasileiro"
            desc="Atuação em atividades e operacionais, desenvolvendo disciplina, responsabilidade, organização e trabalho em equipe."
            tags={['Responsabilidade','Proativo','Hierarquia','Disciplina']}
          />
        </div>
      </Section>

      {/* ── PROJETOS ── */}
      <Section id="projetos">
        <SectionTitle eyebrow="o que construí" title="Projetos em destaque" />
        <div className="projects-grid">
          <ProjectCard
            emoji="🛍️"
            title="FalconStore"
            desc="Plataforma de e-commerce completa com catálogo de produtos, carrinho de compras, autenticação de usuários e integração com meios de pagamento."
            tags={['PHP','SQL','XAMPP','HTML/CSS']}
          />
          <ProjectCard
            emoji="📝"
            title="Todo-List em Desenvolvimento"
            desc="Aplicação web para gerenciamento de tarefas com armazenamento local. Permite adicionar, editar, concluir e remover tarefas de forma prática, utilizando React, Vite e Node.js para criar uma experiência rápida e responsiva."
            tags={['React','Vite','Node.js','LocalStorage']}
          />
          <ProjectCard
            emoji="✈️"
            title="Jornada Viagens"
            desc=" Site web desenvolvida para uma agência de viagens, com foco na apresentação de destinos, pacotes turísticos e informações de contato. Projeto responsivo criado para proporcionar uma navegação intuitiva e uma melhor experiência ao usuário."
            tags={['HTML','CSS','JavaScript','SEO']}
          />
        </div>
      </Section>

      {/* ── CONTATO ── */}
      <Section id="contato" className="contact-section">
        <SectionTitle eyebrow="bora conversar" title="Entre em contato" />
        <div className="contact-inner">
          <p className="contact-sub">Estou aberto a novos projetos, oportunidades e conversas interessantes. Me manda uma mensagem!</p>
          <div className="contact-cards">
            <button className="contact-card" onClick={copy}>
              <span className="cc-icon">✉️</span>
              <span className="cc-label">E-mail</span>
              <span className="cc-value">{copied ? '✓ Copiado!' : 'arthursales.sr@gmail.com'}</span>
            </button>
            <a className="contact-card" href="https://www.linkedin.com/in/arthur-sales-8b384131a/" target="_blank" rel="noreferrer">
              <span className="cc-icon">💼</span>
              <span className="cc-label">LinkedIn</span>
              <span className="cc-value">/in/arthur-sales</span>
            </a>
            <a className="contact-card" href="https://github.com/Arthrsales" target="_blank" rel="noreferrer">
              <span className="cc-icon">🐙</span>
              <span className="cc-label">GitHub</span>
              <span className="cc-value">/ArthrSales</span>
            </a>
          </div>
        </div>
      </Section>

      <footer className="footer">
        <span>© 2026 Arthur Sales</span>
        <span>Feito com React + Vite ⚡</span>
      </footer>
    </>
  )
}
