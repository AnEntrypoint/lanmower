// renders the inlined gh data. nothing fancy, no framework, no build step.
// if it breaks, check data.js loaded first (see index.html script order).
(function(){
  "use strict";

  var USER  = window.LANMOWER_USER  || {};
  var REPOS = (window.LANMOWER_REPOS || []).slice();

  // github palette; unknowns fall through to --dim
  var LANG_COLORS = {
    'JavaScript':'#f1e05a','TypeScript':'#3178c6','HTML':'#e34c26','CSS':'#563d7c',
    'C++':'#f34b7d','C':'#555555','Python':'#3572A5','Go':'#00ADD8','Rust':'#dea584',
    'PHP':'#4F5D95','Ruby':'#701516','Java':'#b07219','Shell':'#89e051','Dockerfile':'#384d54',
    'Astro':'#ff5a03','GDScript':'#355570','Vue':'#41b883','Svelte':'#ff3e00',
    'Makefile':'#427819','Solidity':'#AA6746','Lua':'#000080','Kotlin':'#A97BFF',
    'Swift':'#F05138','Objective-C':'#438eff'
  };
  function langColor(l){ return LANG_COLORS[l] || '#5b6a85'; }

  function el(tag,attrs,children){
    var n=document.createElement(tag);
    if(attrs) for(var k in attrs){
      if(k==='class') n.className=attrs[k];
      else if(k==='html') n.innerHTML=attrs[k];
      else if(k==='text') n.textContent=attrs[k];
      else n.setAttribute(k,attrs[k]);
    }
    if(children) children.forEach(function(c){ if(c) n.appendChild(typeof c==='string'?document.createTextNode(c):c); });
    return n;
  }
  function fmtDate(s){ if(!s) return ''; var d=new Date(s); return d.toLocaleDateString(undefined,{year:'numeric',month:'short'}); }

  function repoCard(r,opts){
    opts = opts || {};
    var stars = r.stars>0 ? el('span',{class:'card-stars'},[r.stars+' stars']) : null;
    var head  = el('div',{class:'card-head'},[
      el('h3',null,[ el('a',{href:r.url,target:'_blank',rel:'noopener'},[r.name]) ]),
      stars
    ]);
    var desc = el('p',{class:'card-desc'},[ r.description || 'No description.' ]);
    var lang = r.language ? el('span',null,[
      el('i',{class:'lang-dot',style:'background:'+langColor(r.language)}),
      r.language
    ]) : el('span',{class:'card-dim'},['-']);
    var foot = el('div',{class:'card-foot'},[
      lang,
      el('span',null,['updated '+fmtDate(r.updated)])
    ]);
    return el('article',{class:'card'},[head,desc,foot]);
  }

  // hero stats: total stars, join year, etc.
  var totalStars = REPOS.reduce(function(s,r){ return s + (r.stars||0); }, 0);
  var joinYear   = USER.created_at ? new Date(USER.created_at).getFullYear() : "2011";
  set("#stat-repos",     USER.public_repos || REPOS.length);
  set("#stat-followers", USER.followers || 0);
  set('#stat-years',     joinYear);
  set('#stat-stars',     totalStars);
  set("#year",           new Date().getFullYear());

  function set(sel,v){ var n=document.querySelector(sel); if(n) n.textContent=v; }

  // featured: use the curated list from data.js if present,
  // otherwise just take the top by stars (tiebreak: most recently updated).
  var featured = (window.LANMOWER_FEATURED && window.LANMOWER_FEATURED.length)
    ? window.LANMOWER_FEATURED.slice()
    : REPOS.slice().sort(function(a,b){
        return (b.stars - a.stars) || (b.updated||'').localeCompare(a.updated||'');
      }).slice(0,8);
  var fg = document.getElementById('featured-grid');
  featured.forEach(function(r){ fg.appendChild(repoCard(r,{featured:true})); });

  // language bar: count repos per language, show top 8, group rest as "Other".
  var counts = {};
  REPOS.forEach(function(r){ if(r.language){ counts[r.language] = (counts[r.language]||0)+1; } });
  var langs = Object.keys(counts).map(function(k){ return {name:k,count:counts[k]}; })
                    .sort(function(a,b){ return b.count - a.count; });
  var total = langs.reduce(function(s,l){ return s+l.count; },0);
  var bar = document.getElementById('lang-bar');
  var legend = document.getElementById('lang-legend');
  var top = langs.slice(0,8);
  var otherCount = langs.slice(8).reduce(function(s,l){ return s+l.count; },0);
  if(otherCount>0) top.push({name:'Other',count:otherCount,color:'#5b6a85'});
  top.forEach(function(l){
    var pct = (l.count/total*100).toFixed(1);
    var color = l.color || langColor(l.name);
    bar.appendChild(el('span',{style:'width:'+pct+'%;background:'+color,title:l.name+' · '+l.count+' repos ('+pct+'%)'}));
    legend.appendChild(el('span',null,[
      el('i',{style:'background:'+color}),
      l.name+' · '+l.count
    ]));
  });

  // projects grid: search, language filter, sort. all client-side, all O(n).
  var grid = document.getElementById('projects-grid');
  var empty = document.getElementById('projects-empty');
  var search = document.getElementById('search');
  var langFilter = document.getElementById('lang-filter');
  var sortSel = document.getElementById('sort');
  var countEl = document.getElementById('projects-count');

  // populate the language dropdown from whatever languages we actually see
  langs.forEach(function(l){
    var o = document.createElement('option');
    o.value = l.name; o.textContent = l.name + ' (' + l.count + ')';
    langFilter.appendChild(o);
  });

  function render(){
    var q = (search.value||'').toLowerCase().trim();
    var lf = langFilter.value;
    var srt = sortSel.value;
    var list = REPOS.filter(function(r){
      if(lf && r.language !== lf) return false;
      if(!q) return true;
      var hay = (r.name+' '+(r.description||'')+' '+(r.language||'')).toLowerCase();
      return hay.indexOf(q) !== -1;
    });
    list.sort(function(a,b){
      if(srt==='stars')   return (b.stars-a.stars) || (b.updated||'').localeCompare(a.updated||'');
      if(srt==='updated') return (b.updated||'').localeCompare(a.updated||'');
      if(srt==='created') return (b.created||'').localeCompare(a.created||'');
      if(srt==='name')    return a.name.localeCompare(b.name);
      return 0;
    });
    grid.innerHTML='';
    list.forEach(function(r){ grid.appendChild(repoCard(r)); });
    empty.hidden = list.length>0;
    countEl.textContent = list.length;
  }

  ['input','change'].forEach(function(ev){
    search.addEventListener(ev,render);
    langFilter.addEventListener(ev,render);
    sortSel.addEventListener(ev,render);
  });
  render();
})();
