import React, { useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from '../config/axios.js';
import { UserContext } from "../context/user.context.jsx";
import Markdown from 'markdown-to-jsx';
import hljs from "highlight.js";
import {getWebContainer} from '../config/webContainer.js'

function SyntaxHighlightedCode(props) {
  const ref = useRef(null)
  React.useEffect(() => {
    if (ref.current && props.className?.includes('lang-') && window.hljs) {
      window.hljs.highlightElement(ref.current)

      // hljs won't reprocess the element unless this attribute is removed
      ref.current.removeAttribute('data-highlighted')
    }
  }, [props.className, props.children])
  return <code {...props} ref={ref} />
}

const Project = () => {
  function WriteAiMessage(message) {
    let messageObject;
    try {
      messageObject = JSON.parse(message.split('```json')[1].split('```')[0]);
  } catch (error) {
      console.error("Invalid JSON:", error);
      messageObject = message.split('```json')[1].split('```')[0];
  }
    return (
        <div
            className='overflow-auto bg-slate-950 text-white rounded-sm p-2'
        >
            <Markdown
                
                options={{
                    overrides: {
                        code: SyntaxHighlightedCode,
                    },
                }}
            >{messageObject.text}</Markdown>
        </div>)
}
  const location = useLocation();
  const { setUser } = useContext(UserContext);
  const {user}=useContext(UserContext);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [openFiles,setOpenFiles]=useState([]);
  const [isModalOpen,setIsModalOpen]=useState(false);
  const [selectedUserId,setSelectedUserId]=useState([]);
  const [users,setUsers]=useState([]);
  const [message,setMessage]=useState("");
  const [messages,setMessages]=useState([]);
  const messageBox = React.createRef()
  const [change,setChange]=useState(0);
  const [project,setProject]=useState(location.state.project);
  const [fileTree,setFileTree]=useState({});
  const [currentFile,setCurrentFile]=useState(null);
  const [webContainer,setWebContainer]=useState(null);
  const [iframeUrl,setIframeUrl]=useState(null);
  const [runProcess,setRunProcess]=useState(null);
  const handleUserClick=(id)=>{
    let temp=selectedUserId.filter((temp)=>
      id==temp
    )
    if(temp.length==1){
      temp=selectedUserId.filter((id)=>
        id!=temp[0]
      )
      setSelectedUserId(temp)
    }
    else{
      setSelectedUserId([...selectedUserId,id]);
    }
  }
  function addCollaborators(){
    axios.put('/projects/add-user',{
      projectId:location.state.project._id,
      users:Array.from(selectedUserId)
    }).then((res)=>{
      console.log(res.data);
    }).catch((err)=>console.log(err));
  }
  const navigate=useNavigate();
  function sendMessage(){
    axios.post(`/rooms/send/${location.state.project._id}`,{message,_id:user._id}).then((res)=>{
      const message = JSON.parse(res.data.split('```json')[1].split('```')[0]);
      if(message.fileTree){
        setFileTree(message.fileTree);
        axios.put(`/projects/fileTree/${location.state.project._id}`,{fileTree:message.fileTree});
        webContainer.mount(fileTree);
      }
    })
    getMessages();
    setChange(!change);
    scrollToBottom();
  }
  function scrollToBottom() {
    messageBox.current.scrollTop = messageBox.current.scrollHeight
}
function getMessages(){
  axios.get(`/rooms/all-messages/${location.state.project._id}`).then((res)=>{
    setMessages(res.data);
  })
}
const handleDelete=({projectId})=>{
  axios.post(`/projects/delete/${projectId}`).then((res)=>{
    navigate('/');
  }).catch((err)=>{
    console.log(err);
  });
}
  useEffect(()=>{
    if(!webContainer){
      getWebContainer().then(container=>{
        setWebContainer(container);
        console.log('container')
      })
    }
    if(webContainer && iframeUrl){
      document.getElementById('update').classList.remove('max-w-[700px]')
      document.getElementById('update').classList.add('max-w-[400px]')
    }
    setUser(location.state.user);
    axios.get(`/projects/get-project/${location.state.project._id}`).then(res=>
      {
        setProject(res.data.project);
        setFileTree(res.data.project.fileTree);
      }
    );
    axios.get(`/rooms/all-messages/${location.state.project._id}`).then((res)=>{
      setMessages(res.data);
    });
    setInterval(getMessages,30000)
    axios.get('/users/all').then((res)=>{
      setUsers(res.data.users);
    }).catch(err=>console.log(err))
    scrollToBottom();
  },[change]);
  return (
    <main className="h-screen w-screen flex overflow-hidden">
      <section className="left min-h-screen relative flex flex-col min-w-96 bg-slate-300">
        <header className="flex justify-between items-center px-4 p-2 w-full bg-slate-100 absolute top-0">
          <button className="flex gap-2" onClick={()=>setIsModalOpen(!isModalOpen)}>
            <i className="ri-add-fill mr-1"></i>
            <p>Add Collaborator</p>
          </button>
          <button>
          <i className="ri-delete-bin-5-fill" onClick={()=>handleDelete({projectId:project._id})}></i>
          </button>
          <button
            onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
            className="p-2"
          >
            <i className="ri-group-fill"></i>
          </button>
        </header>
        <div className="conversation-area pt-14 flex-grow flex flex-col overflow-scroll">
            <div ref={messageBox} className="message-box p-1 flex-grow flex flex-col gap-1 max-h-full overflow-auto">
              {
                messages.map(({text_message,createdAt,category,userId,_id})=>{
                  if(category!=='ai'){
                    return <div key={_id} className={`${user._id==userId._id ? 'ml-auto' : ''} message max-w-56 flex flex-col p-2 bg-slate-50 w-fit rounded-md`}>
                      <small className="opacity-65 test-xs">{userId.email}</small>
                      <p className="text-sm">
                        {text_message}
                      </p>
                    </div>
                  }
                  else{
                    return <div key={_id} className={`message max-w-80 flex flex-col p-2 bg-slate-50 w-fit rounded-md`}>
                      <small className="opacity-65 test-xs">Ai</small>
                      <div className="text-sm">
                        <div className="overflow-scroll bg-slate-950 text-white ai-message">
                        {WriteAiMessage(text_message)}
                        </div>
                      </div>
                    </div>
                  }
                })
              }
            </div>
          <div className="inputField w-full flex bottom-0">
            <input
              type="text"
              className="py-2 px-4 border-none outline-none flex-grow"
              placeholder="Enter message"
              value={message}
              onChange={(e)=>{setMessage(e.target.value);}}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                  setMessage("");
                }
              }}
            />
            <button onClick={()=>{sendMessage();setMessage("")}}  className="px-5 bg-slate-950 text-white">
              <i className="ri-send-plane-fill"></i>
            </button>
          </div>
        </div>
        <div
          className={`sidePanel flex flex-col gap-2 w-full h-full bg-slate-50 ${
            isSidePanelOpen ? "translate-x-0" : "-translate-x-full"
          } absolute transition-all top-0`}
        >
          <header className="flex justify-between items-center p-2 px-4 bg-slate-200">
            <h1 className="font-semibold text-lg">Collaborators</h1>
            <button
              className="p-2"
              onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
            >
              <i className="ri-close-fill"></i>
            </button>
          </header>
          <div className="users flex flex-col gap-2">
            {
              project.users && project.users.map((user,i)=>{
                return <div key={i} className="user cursor-pointer hover:bg-slate-200 p-2 flex gap-2 items-center">
                  <div className="aspect-square w-fit h-fit text-white flex justify-center items-center rounded-full bg-slate-500 p-5">
                    <i className="ri-user-fill absolute"></i>
                  </div>
                  <h1 className="font-semibold text-lg">{user.email}</h1>
                </div>
              })
            }
            
          </div>
        </div>
      </section>
      <section className="right bg-red-50 flex-grow h-full flex">
            <div className="explorer h-full max-w-64 min-w-52 bg-slate-200">
              <div className="file-tree w-full">
                {
                  fileTree && Object.keys(fileTree).map((file,index)=>(
                    <button key={index} onClick={()=>{setCurrentFile(file);setOpenFiles([ ...new Set([ ...openFiles, file ]) ])}} className="tree-element cursor-pointer p-2 px-4 gap-2 flex items-center bg-slate-300 w-full">
                      <p className="font-semibold text-lg">{file}</p>
                    </button>
                  ))
                }
              </div>
            </div>
                <div id="update" className="code-editor max-w-[700px] overflow-scroll flex flex-col flex-grow h-full shrink">
                  <div className="top flex justify-between max-w-full">
                    <div className="files flex">
                    {
                        openFiles.map((file, index) => {
                          return (
                            <button
                                key={index}
                                onClick={() => setCurrentFile(file)}
                                className={`open-file cursor-pointer p-2 px-4 flex items-center w-fit gap-2 bg-slate-300 ${currentFile === file ? 'bg-slate-400' : ''}`}>
                                <p
                                    className='font-semibold text-lg'
                                >{file}</p>
                            </button>
                          )
                        })
                    }
                    </div>
                    <div className="actions flex gap-2">
                      <button 
                      onClick={
                        async()=>{
                          await webContainer?.mount(fileTree)
                          const installProcess=await webContainer?.spawn('npm',["install"]);
                          installProcess.output.pipeTo(new WritableStream({
                            write(chunk){
                              console.log(chunk);
                            }
                          }))
                          if(runProcess){
                            runProcess.kill();
                          }
                          const tempRunProcess=await webContainer?.spawn('npm',["start"]);
                          tempRunProcess.output.pipeTo(new WritableStream({
                            write(chunk){
                              console.log(chunk);
                            }
                          }))
                          setRunProcess(tempRunProcess);
                          webContainer?.on('server-ready',(port,url)=>{
                            console.log(port,url);
                            setIframeUrl(url);
                          })
                        }} className="p-2 px-4 bg-slate-300 text-white">run</button>
                    </div>
                  </div>
                  <div className="bottom overflow-auto flex flex-grow max-w-full shrink ">
                    {
                      fileTree && fileTree[currentFile] && (
                        <div className="code-editor-area h-full overflow-auto flex-grow bg-slate-50">
                                    <pre
                                        className="hljs h-full">
                                        <code
                                            className="hljs h-full outline-none"
                                            contentEditable
                                            suppressContentEditableWarning
                                            onBlur={async(e) => {
                                                const updatedContent = e.target.innerText;
                                                const ft = {
                                                    ...fileTree,
                                                    [ currentFile ]: {
                                                        file: {
                                                            contents: updatedContent
                                                        }
                                                    }
                                                }
                                                setFileTree(ft)
                                                await axios.put(`/projects/fileTree/${location.state.project._id}`,{fileTree});
                                            }}
                                            dangerouslySetInnerHTML={{
                                              __html: hljs.highlight(fileTree[currentFile].file.contents, { language: 'javascript' }).value
                                            }}
                                        />
                                    </pre>
                                </div>
                      )
                    }
                  </div>
                </div>
                {iframeUrl && webContainer && 
                  <div className="flex flex-col h-full">
                    <div className="address-bar">
                      <input type="text" value={iframeUrl} onChange={(e)=>setIframeUrl(e.target.value)} className="w-full p-2 px-4 bg-slate-200" />
                    </div>
                    <iframe src={iframeUrl} className="w-1/2 h-full"></iframe>
                  </div>
                }
              
      </section>
      {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-4 rounded-md w-96 max-w-full relative">
                        <header className='flex justify-between items-center mb-4'>
                            <h2 className='text-xl font-semibold'>Select User</h2>
                            <button onClick={() => setIsModalOpen(false)} className='p-2'>
                                <i className="ri-close-fill"></i>
                            </button>
                        </header>
                        <div className="users-list flex flex-col gap-2 mb-16 max-h-96 ">
                            {users.map(user => (
                                <div key={user._id} className={`user cursor-pointer hover:bg-slate-200 ${selectedUserId.indexOf(user._id) != -1 ? 'bg-slate-200' : ""} p-2 flex gap-2 items-center`} onClick={() => handleUserClick(user._id)}>
                                    <div className='aspect-square relative rounded-full w-fit h-fit flex items-center justify-center p-5 text-white bg-slate-600'>
                                        <i className="ri-user-fill absolute"></i>
                                    </div>
                                    <h1 className='font-semibold text-lg'>{user.email}</h1>
                                </div>
                            ))}
                        </div>
                        <button
                        onClick={addCollaborators}
                            className='absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-blue-600 text-white rounded-md'>
                            Add Collaborators
                        </button>
                    </div>
                </div>
            )}
    </main>
  );
};

export default Project;