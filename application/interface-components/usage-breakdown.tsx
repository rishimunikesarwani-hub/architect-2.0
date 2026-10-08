import {useId,useState} from 'react';
import {useConvexAuth,useQuery} from 'convex/react';
import {anyApi} from 'convex/server';
import {ArrowUpRight,Bot,ChevronDown,Loader2} from 'lucide-react';
import {parseCloudState} from '../shared-logic/parse-cloud-state';
import type {AgentSpec,Project} from '../types';
import './usage-breakdown.css';

type Props={projects:Project[];signedIn:boolean;onOpen:(id:string)=>void};
type Totals={build:number;runtime:number;requests:number};
const samples:Totals[]=[{build:12,runtime:3,requests:18},{build:24,runtime:6,requests:42},{build:8,runtime:2,requests:9}];
const number=new Intl.NumberFormat('en-US');

function sampleFor(projectId:string):Totals{
 let hash=0;
 for(const character of projectId)hash=(Math.imul(hash,31)+character.charCodeAt(0))>>>0;
 return samples[hash%samples.length];
}

function Metrics({totals}:{totals:Totals}){
 return <dl className="ub-metrics">
  <div><dt>Build credits</dt><dd>{number.format(totals.build)}</dd></div>
  <div><dt>Runtime credits</dt><dd>{number.format(totals.runtime)}</dd></div>
  <div><dt>Sample requests</dt><dd>{number.format(totals.requests)}</dd></div>
 </dl>;
}

function AgentUsage({agents,projectId}:{agents:AgentSpec[];projectId:string}){
 const totals=agents.length?sampleFor(projectId):{build:0,runtime:0,requests:0};
 // Allocate whole example units without rounding drift; each column sums to its app total.
 const share=(total:number,index:number)=>Math.floor(total/agents.length)+(index<total%agents.length?1:0);
 return <>
  <div className="ub-app-total"><div><h4>App sample total</h4><p>{agents.length} configured agent{agents.length===1?'':'s'}</p></div><Metrics totals={totals}/></div>
  {agents.length>0?<>
   <h4 className="ub-list-heading">Per-agent breakdown <span>Illustrative data</span></h4>
   <ul className="ub-agent-list" aria-label="Illustrative usage by agent">{agents.map((agent,index)=><li key={`${index}-${agent.name}`}>
    <div className="ub-agent-name"><Bot size={18} aria-hidden="true"/><div><h5>{agent.name.trim()||`Unnamed agent ${index+1}`}</h5><p>{agent.role.trim()||'No role configured'}</p><small>{agent.model.trim()||'No model configured'}</small></div></div>
    <Metrics totals={{build:share(totals.build,index),runtime:share(totals.runtime,index),requests:share(totals.requests,index)}}/>
   </li>)}</ul>
   <p className="ub-method">These sample app totals are divided equally across the listed agents; any whole-unit remainder goes to the first agents. Each column adds up to the app total. A zero means no sample units were allocated, not measured inactivity.</p>
  </>:<p className="ub-empty">No agents are configured in this app, so its illustrative totals are zero. No usage has been measured.</p>}
 </>;
}

function SavedAgentUsage({projectId}:{projectId:string}){
 const {isAuthenticated,isLoading}=useConvexAuth();
 const saved=useQuery(anyApi.projects.watch,isAuthenticated?{id:projectId}:'skip') as {stateJson:string}|null|undefined;
 if(isLoading||isAuthenticated&&saved===undefined)return <p className="ub-state" role="status"><Loader2 size={16} className="spin" aria-hidden="true"/>Loading this app’s saved agents…</p>;
 if(!isAuthenticated||!saved)return <p className="ub-state" role="status">This app is no longer available to your account. Its usage breakdown is not shown.</p>;
 const parsed=parseCloudState(saved.stateJson);
 if(parsed.invalid||!parsed.state)return <p className="ub-state" role="status">The saved agent configuration could not be read. Sample totals are unavailable; no project data was changed.</p>;
 return <AgentUsage agents={parsed.state.agents} projectId={projectId}/>;
}

export default function UsageBreakdown({projects,signedIn,onOpen}:Props){
 const [openId,setOpenId]=useState<string|null>(null);
 const prefix=useId();
 return <section className="surface ub-section" aria-labelledby={`${prefix}-heading`}>
  <div className="surface-title ub-heading"><h2 id={`${prefix}-heading`}>Build & runtime usage</h2><span className="badge amber">Illustrative data</span></div>
  <p className="ub-intro">Review an app, then see how example credits are distributed across its configured agents. These fictional values are not metered usage, charges, a credit balance, or vendor prices.</p>
  {projects.length===0?<p className="ub-empty ub-no-projects">No apps to review yet. Create a project to explore its agents and sample breakdown.</p>:<div className="ub-apps">{projects.map((project,index)=>{
   const expanded=openId===project.id,regionId=`${prefix}-agents-${index}`,buttonId=`${prefix}-toggle-${index}`;
   return <article className="ub-app" key={project.id}>
    <h3><button id={buttonId} type="button" className="ub-toggle" aria-expanded={expanded} aria-controls={regionId} onClick={()=>setOpenId(expanded?null:project.id)}>
     <span className="ub-app-name">{project.title}<small>{project.framework} · Sample usage</small></span>
     <span className="ub-toggle-label">{expanded?'Hide agents':'View agents'}<ChevronDown size={16} aria-hidden="true"/></span>
    </button></h3>
    <div id={regionId} role="region" aria-labelledby={buttonId} hidden={!expanded} className="ub-detail">{expanded&&<>
     {signedIn?<SavedAgentUsage key={project.id} projectId={project.id}/>:project.invalidStateJson!==undefined||project.stateLoaded===false?<p className="ub-state" role="status">Agent details are unavailable. Sample totals are not shown.</p>:<AgentUsage agents={project.state.agents} projectId={project.id}/>}
     <div className="ub-detail-footer"><span>Read-only sample · No model calls or billing</span><button type="button" className="btn btn-small btn-secondary" onClick={()=>onOpen(project.id)} aria-label={`Open ${project.title}`}>Open app<ArrowUpRight size={14} aria-hidden="true"/></button></div>
    </>}</div>
   </article>;
  })}</div>}
 </section>;
}
