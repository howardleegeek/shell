function p(t,...n){if(typeof t!="string"){const s=t.reduce((r,i,o)=>(r+=i+(n[o]??""),r),"");return e(s)}return e(t)}function e(t){return t.split(`
`).map(n=>n.trim()).join(`
`).trimStart().replace(/[\r\n]$/,"")}const l=globalThis||void 0||self;export{l as g,p as s};
