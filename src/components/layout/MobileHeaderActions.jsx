import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, MoreVertical } from 'lucide-react';
export default function MobileHeaderActions({ onAdd, addLabel='Add', disabled=false, items=[] }) {
 const [target,setTarget]=useState(null);
 const [open,setOpen]=useState(false);
 useEffect(()=>{setTarget(document.getElementById('cero-mobile-header-actions'));},[]);
 if(!target)return null;
 return createPortal(<>{onAdd&&<button type="button" className="cero-header-icon" aria-label={addLabel} disabled={disabled} onClick={onAdd}><Plus size={22}/></button>}{items.length>0&&<div className="relative"><button type="button" className="cero-header-icon" aria-label="More options" aria-expanded={open} onClick={()=>setOpen(v=>!v)}><MoreVertical size={22}/></button>{open&&<><button type="button" aria-label="Close menu" className="fixed inset-0 z-10 cursor-default" onClick={()=>setOpen(false)}/><div className="absolute right-0 top-full z-20 min-w-44 rounded-md border border-border bg-popover p-1 shadow-lg">{items.map(item=><button key={item.label} type="button" className="block w-full whitespace-nowrap px-3 py-2 text-left text-sm hover:bg-muted" onClick={()=>{setOpen(false);item.onClick();}}>{item.label}</button>)}</div></>}</div>}</>,target);
}
