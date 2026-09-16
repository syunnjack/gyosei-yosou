import React from 'react'
import { createRoot } from 'react-dom/client'
import Shell from './Shell.jsx'
import Article from './Article.jsx'
import './index.css'
// どの記事を出すかは、生成したHTMLが window.__SLUG__ で渡す。
createRoot(document.getElementById('root')).render(
 <React.StrictMode><Shell><Article slug={window.__SLUG__}/></Shell></React.StrictMode>
)
