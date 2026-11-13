import math, sys, os
C30=math.cos(math.radians(30)); S30=0.5
OUT=sys.argv[1]

PAL={
 'colour':dict(slab_top='#F4F5F6',slab_side='#E6E8EA',slab_stroke='#C9CDD2',
   ghost_fill='#EEF0F2',ghost_stroke='#D3D7DB',ghost_op=0.55,
   rack_top='#5B6470',rack_l='#3E4650',rack_r='#4C5560',rack_stroke='#2B3138',
   unit_top='#F7F8F9',unit_l='#DADDE1',unit_r='#E8EAED',unit_stroke='#8C939B',
   chw_f='#3BA3EC',chw_r='#F4A57A',cond='#9AA33A',fuel='#7FD98A',bus='#8A5A2B',ladder='#E2B92E',
   flue='#6B7280',contain='#BFE3F5',contain_op=0.45,pipe_edge=0.62,line=1.0),
 'grey':dict(slab_top='#FFFFFF',slab_side='#F6F6F6',slab_stroke='#D4D4D4',
   ghost_fill='#FFFFFF',ghost_stroke='#E2E2E2',ghost_op=0.0,
   rack_top='#FAFAFA',rack_l='#EDEDED',rack_r='#F4F4F4',rack_stroke='#9A9A9A',
   unit_top='#FFFFFF',unit_l='#F0F0F0',unit_r='#F7F7F7',unit_stroke='#9A9A9A',
   chw_f='#FBFBFB',chw_r='#FBFBFB',cond='#FBFBFB',fuel='#FBFBFB',bus='#F2F2F2',ladder='#FFFFFF',
   flue='#F2F2F2',contain='#FFFFFF',contain_op=0.0,pipe_edge=None,line=0.9),
}

def P(x,y,z): return ((x-y)*C30, (x+y)*S30 - z)

class Scene:
    def __init__(s,pal): s.p=PAL[pal]; s.mode=pal; s.items=[]; s.pts=[]
    def add(s,depth,svg,pts): s.items.append((depth,len(s.items),svg)); s.pts+=pts
    def poly(s,pts3,fill,stroke,sw=1,op=1):
        pts=[P(*q) for q in pts3]
        d=' '.join(f'{a:.1f},{b:.1f}' for a,b in pts)
        return f'<polygon points="{d}" fill="{fill}" fill-opacity="{op}" stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round"/>',pts
    def box(s,x,y,z,w,d,h,kind='unit',depth=None,op=1,sw=None):
        p=s.p
        if kind=='rack': ft,fl,fr,st=p['rack_top'],p['rack_l'],p['rack_r'],p['rack_stroke']
        elif kind=='ghost': ft=fl=fr=p['ghost_fill']; st=p['ghost_stroke']; op=p['ghost_op']
        elif kind=='slab': ft,fl,fr,st=p['slab_top'],p['slab_side'],p['slab_side'],p['slab_stroke']
        else: ft,fl,fr,st=p['unit_top'],p['unit_l'],p['unit_r'],p['unit_stroke']
        sw=sw or 1.2*p['line']
        g=[];allp=[]
        for pts3,f in [([(x,y+d,z),(x+w,y+d,z),(x+w,y+d,z+h),(x,y+d,z+h)],fl),
                       ([(x+w,y,z),(x+w,y+d,z),(x+w,y+d,z+h),(x+w,y,z+h)],fr),
                       ([(x,y,z+h),(x+w,y,z+h),(x+w,y+d,z+h),(x,y+d,z+h)],ft)]:
            e,pp=s.poly(pts3,f,st,sw,op); g.append(e); allp+=pp
        if depth is None: depth=(x+w)+(y+d)+z*0.01
        s.add(depth,'<g>'+''.join(g)+'</g>',allp)
    def ellipse_top(s,cx,cy,z,r,fill,stroke,depth):
        X,Y=P(cx,cy,z)
        s.add(depth,f'<ellipse cx="{X:.1f}" cy="{Y:.1f}" rx="{r*C30*math.sqrt(2):.1f}" ry="{r*S30*math.sqrt(2):.1f}" fill="{fill}" stroke="{stroke}" stroke-width="{1.1*s.p["line"]}"/>',[(X,Y)])
    def pipe(s,pts3,dia,col,depth):
        p=s.p; pts=[P(*q) for q in pts3]
        d='M'+' L'.join(f'{a:.1f},{b:.1f}' for a,b in pts)
        w=dia*0.9
        if s.mode=='grey':
            svg=(f'<path d="{d}" fill="none" stroke="#9A9A9A" stroke-width="{w+2.2:.1f}" stroke-linecap="round" stroke-linejoin="round"/>'
                 f'<path d="{d}" fill="none" stroke="{col}" stroke-width="{w:.1f}" stroke-linecap="round" stroke-linejoin="round"/>')
        else:
            svg=(f'<path d="{d}" fill="none" stroke="{shade(col,p["pipe_edge"])}" stroke-width="{w+2.4:.1f}" stroke-linecap="round" stroke-linejoin="round"/>'
                 f'<path d="{d}" fill="none" stroke="{col}" stroke-width="{w:.1f}" stroke-linecap="round" stroke-linejoin="round"/>'
                 f'<path d="{d}" fill="none" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="{max(w*0.22,1):.1f}" stroke-linecap="round" stroke-linejoin="round" transform="translate(0,{-w*0.18:.1f})"/>')
        s.add(depth,svg,pts)
    def ladder(s,a,b,z,width,depth,rung=300):
        # straight run along x or y between (ax,ay) and (bx,by)
        p=s.p; (ax,ay),(bx,by)=a,b
        L=math.hypot(bx-ax,by-ay); ux,uy=(bx-ax)/L,(by-ay)/L; nx,ny=-uy,ux
        hw=width/2; col=p['ladder']; st='#8F7414' if s.mode=='colour' else '#9A9A9A'
        g=[];pts=[]
        n=int(L//rung)
        for i in range(n+1):
            t=i*rung; cx,cy=ax+ux*t,ay+uy*t
            p1=P(cx+nx*hw,cy+ny*hw,z); p2=P(cx-nx*hw,cy-ny*hw,z)
            g.append(f'<line x1="{p1[0]:.1f}" y1="{p1[1]:.1f}" x2="{p2[0]:.1f}" y2="{p2[1]:.1f}" stroke="{st}" stroke-width="{0.9*p["line"]}"/>')
        for sgn in (1,-1):
            q1=P(ax+nx*hw*sgn,ay+ny*hw*sgn,z); q2=P(bx+nx*hw*sgn,by+ny*hw*sgn,z)
            g.append(f'<line x1="{q1[0]:.1f}" y1="{q1[1]:.1f}" x2="{q2[0]:.1f}" y2="{q2[1]:.1f}" stroke="{st}" stroke-width="5" stroke-linecap="round"/>')
            g.append(f'<line x1="{q1[0]:.1f}" y1="{q1[1]:.1f}" x2="{q2[0]:.1f}" y2="{q2[1]:.1f}" stroke="{col}" stroke-width="3" stroke-linecap="round"/>')
            pts+=[q1,q2]
        s.add(depth,''.join(g),pts)
    def panel(s,pts3,depth):
        p=s.p
        if s.mode=='grey':
            e,pp=s.poly(pts3,'#FFFFFF','#BDBDBD',0.8,1)
        else:
            e,pp=s.poly(pts3,p['contain'],'#7FB6D6',0.8,p['contain_op'])
        s.add(depth,e,pp)
    def render(s,path,W=2000,pad=60):
        xs=[a for a,b in s.pts]; ys=[b for a,b in s.pts]
        x0,x1,y0,y1=min(xs),max(xs),min(ys),max(ys)
        vw,vh=x1-x0+2*pad,y1-y0+2*pad
        body=''.join(svg for _,_,svg in sorted(s.items,key=lambda t:(t[0],t[1])))
        H=int(W*vh/vw)
        open(path,'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="{x0-pad:.1f} {y0-pad:.1f} {vw:.1f} {vh:.1f}"><rect x="{x0-pad}" y="{y0-pad}" width="{vw}" height="{vh}" fill="#FFFFFF"/>{body}</svg>')

def shade(h,f):
    h=h.lstrip('#'); r,g,b=(int(h[i:i+2],16) for i in (0,2,4))
    return '#%02x%02x%02x'%(int(r*f),int(g*f),int(b*f))

SC=0.045  # mm -> px
def mm(*v): return [a*SC for a in v]

def data_hall(mode):
    s=Scene(mode)
    L,Wd=26000,15000
    s.box(*mm(0,0,-300,L,Wd,300),kind='slab',depth=-1e9)
    # ghost columns
    for cx in range(0,L+1,6500):
        for cy in (0,Wd-500):
            s.box(*mm(cx-250 if cx else 0,cy,0,500,500,4200),kind='ghost',depth=-1e8+cx)
    # CRAH units along back wall (y=0 side)
    for i in range(6):
        x=2000+i*3900
        s.box(*mm(x,600,0,2400,900,2100),kind='unit')
    # rack rows: pairs with hot aisle containment
    rw,rd,rh=600,1200,2200
    rows_y=[3600,6000,9200,11600]
    for ri,ry in enumerate(rows_y):
        for k in range(30):
            x=3000+k*rw
            s.box(*mm(x,ry,0,rw,rd,rh),kind='rack',sw=0.6)
    # hot aisle roofs between pairs
    for (a,b) in [(rows_y[0]+rd,rows_y[1]),(rows_y[2]+rd,rows_y[3])]:
        x0,x1=3000,3000+30*rw
        s.panel([tuple(mm(x0,a,rh)),tuple(mm(x1,a,rh)),tuple(mm(x1,b,rh)),tuple(mm(x0,b,rh))],depth=mm(x1)[0]+mm(b)[0]+0.5)
    # ladder containment over each row
    for ry in rows_y:
        y=ry+rd/2
        s.ladder(tuple(mm(2400,y)),tuple(mm(21600,y)),mm(3000)[0],mm(450)[0],depth=1e6)
    # cross ladder at row ends
    s.ladder(tuple(mm(2400,2600)),tuple(mm(2400,13000)),mm(3000)[0],mm(600)[0],depth=1e6+1)
    # busway over each row
    for ry in rows_y:
        y=ry+rd/2+500
        s.pipe([tuple(mm(2800,y,2700)),tuple(mm(21200,y,2700))],5,s.p['bus'],1e6+2)
    # chilled water: perimeter flow/return at high level feeding CRAHs
    for off,col in ((300,s.p['chw_f']),(-300,s.p['chw_r'])):
        yy=1700+off
        pts=[mm(-1500,yy,3700),mm(24000,yy,3700),mm(24000,yy,3700)]
        s.pipe([tuple(p) for p in pts[:2]],11,col,1e6+3)
        for i in range(6):
            x=2000+i*3900+1200+off
            s.pipe([tuple(mm(x,yy,3700)),tuple(mm(x,1050,3700)),tuple(mm(x,1050,2100))],6,col,1e6+4)
        # riser up
        s.pipe([tuple(mm(24000,yy,3700)),tuple(mm(24000+off*2,yy,3700)),tuple(mm(24000+off*2,yy,6000))],11,col,1e6+5)
    return s

def chiller_plant(mode):
    s=Scene(mode)
    L,Wd=30000,15000
    s.box(*mm(0,0,-300,L,Wd,300),kind='slab',depth=-1e9)
    # chillers at back
    for i in range(4):
        x=1500+i*7000
        s.box(*mm(x,1000,0,5600,2300,2400),kind='unit',depth=-1e7+i)
        for f in range(4):
            s.ellipse_top(*mm(x+700+f*1400,2150,2400,500),'#FFFFFF' if mode=='grey' else '#E9ECEF',s.p['unit_stroke'],depth=-1e7+i+0.5)
    # flow and return headers in front, low level
    hf,hr=6500,8000
    for i in range(4):
        x=1500+i*7000+4300
        s.pipe([tuple(mm(x,3300,900)),tuple(mm(x,hf,900))],9,s.p['chw_f'],1e5+i)
        s.pipe([tuple(mm(x+700,3300,1500)),tuple(mm(x+700,hr,1500)),tuple(mm(x+700,hr,900))],9,s.p['chw_r'],1e5+i+0.1)
    s.pipe([tuple(mm(1000,hf,900)),tuple(mm(28800,hf,900)),tuple(mm(28800,hf,5500))],15,s.p['chw_f'],2e5)
    s.pipe([tuple(mm(1000,hr,900)),tuple(mm(29600,hr,900)),tuple(mm(29600,hr,5500))],15,s.p['chw_r'],2e5+1)
    # pump sets in front of headers
    for i in range(5):
        x=3000+i*5000
        s.box(*mm(x,10500,0,1600,1000,1000),kind='unit',depth=3e5+i)
        s.pipe([tuple(mm(x+800,10500,700)),tuple(mm(x+800,hf,700)),tuple(mm(x+800,hf,900))],6,s.p['chw_f'],2.5e5+i)
    return s

def generator_yard(mode):
    s=Scene(mode)
    L,Wd=30000,17000
    s.box(*mm(0,0,-300,L,Wd,300),kind='slab',depth=-1e9)
    # switchroom at the back
    s.box(*mm(2000,800,0,24000,3500,4200),kind='unit',depth=-1e7)
    # main ladder along switchroom front, high level
    s.ladder(tuple(mm(3000,5300)),tuple(mm(25000,5300)),mm(3600)[0],mm(750)[0],depth=-5e6)
    # generators in front
    for i in range(3):
        x=2500+i*7800
        gy=8500
        s.ladder(tuple(mm(x+3100,5300)),tuple(mm(x+3100,gy)),mm(3600)[0],mm(600)[0],depth=-4e6+i)
        s.box(*mm(x,gy,0,6200,3000,3400),kind='unit',depth=-1e6+i)
        for k in range(6):
            a=P(*mm(x+6200,gy+400+k*400,600)); b=P(*mm(x+6200,gy+400+k*400,2800))
            s.add(-1e6+i+0.2,f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="{s.p["unit_stroke"]}" stroke-width="0.8"/>',[a,b])
        for f in (0,1):
            fx=x+1600+f*1400
            s.pipe([tuple(mm(fx,gy+1500,3400)),tuple(mm(fx,gy+1500,8000))],11,s.p['flue'],-1e6+i+0.3+f*0.01)
        s.pipe([tuple(mm(x+4500,14500,500)),tuple(mm(x+4500,gy+3000,500))],5,s.p['fuel'],1e5+i)
    # bulk fuel tank and fuel main in front
    s.pipe([tuple(mm(2500,14500,500)),tuple(mm(25500,14500,500))],6,s.p['fuel'],2e5)
    s.box(*mm(25500,13000,0,3500,3200,2400),kind='unit',depth=3e5)
    return s

os.makedirs(OUT,exist_ok=True)
for name,fn in (('dc-hall',data_hall),('dc-chillers',chiller_plant),('dc-generators',generator_yard)):
    for mode in ('colour','grey'):
        fn(mode).render(f'{OUT}/{name}-{mode}.svg')
print('done')
