import { BarChart3, BookOpen, BrainCircuit, Database, Flag, Gauge, ScrollText, ShieldCheck, Target } from 'lucide-react'
import { to } from './paths.js'

// タブを持たないページ（記事など）のための、サイドバーとヘッダーだけの枠。
// App.jsx のタブと同じ見た目になるよう、クラス名は揃えてある。
const links = [
 { label: '予測レポート', href: to(''), icon: <Target/> },
 { label: '出題分析', href: to(''), icon: <BarChart3/> },
 { label: '予想問題', href: to(''), icon: <BookOpen/> },
 { label: 'AI実力スコア', href: to('ai-score/'), icon: <Gauge/> },
 { label: '合格作戦', href: to('strategy/'), icon: <Flag/> },
 { label: '受験記', href: to('articles/'), icon: <ScrollText/>, current: true }
]

export default function Shell({ children }) {
 return <div className="app">
  <aside className="side">
   <div className="brand"><div className="brand-mark">G</div><div><b>GYOSAI</b><span>LEGAL EXAM INTELLIGENCE</span></div></div>
   <nav>{links.map(l => <a key={l.label} href={l.href} className={l.current ? 'active' : ''}>{l.icon}{l.label}</a>)}</nav>
   <div className="model-card"><div className="pulse"><BrainCircuit/></div><span>ANALYSIS MODEL</span><strong>Gyosei Forecast v1.0</strong><p>6年分・360問を対象に、科目配分と本文信号を統合。</p><div><i/>解析ステータス: ACTIVE</div></div>
   <p className="disclaimer"><ShieldCheck/>本サービスは学習支援用です。出題を保証するものではありません。</p>
  </aside>
  <main>
   <header><div><span className="eyebrow">2026 EXAM FORECAST</span><h1>行政書士試験 <em>AI予測分析</em></h1></div><div className="header-stat"><Database/><span>解析済み<strong>360 Questions</strong></span></div></header>
   {children}
  </main>
 </div>
}
