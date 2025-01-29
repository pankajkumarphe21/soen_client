import React, { useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from '../config/axios.js';
import { UserContext } from "../context/user.context.jsx";
import Markdown from 'markdown-to-jsx'

const Project = () => {
  const location = useLocation();
  const { setUser } = useContext(UserContext);
  const {user}=useContext(UserContext);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isModalOpen,setIsModalOpen]=useState(false);
  const [selectedUserId,setSelectedUserId]=useState([]);
  const [users,setUsers]=useState([]);
  const [message,setMessage]=useState("");
  const [messages,setMessages]=useState([]);
  const messageBox = React.createRef()
  const [change,setChange]=useState(0);
  const [project,setProject]=useState(location.state.project);
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
  function sendMessage(){
    axios.post(`/rooms/send/${location.state.project._id}`,{message,_id:user._id}).then((res)=>{
      console.log('message sent');
      console.log(res.data)
    })
    getMessages();
    setChange(!change)
  }
  function scrollToBottom() {
    messageBox.current.scrollTop = messageBox.current.scrollHeight
}
function getMessages(){
  axios.get(`/rooms/all-messages/${location.state.project._id}`).then((res)=>{
    setMessages(res.data);
  })
}
  useEffect(()=>{
    setUser(location.state.user);
    axios.get(`/projects/get-project/${location.state.project._id}`).then(res=>
      {
        setProject(res.data.project);
      }
    );
    console.log(user);
    axios.get(`/rooms/all-messages/${location.state.project._id}`).then((res)=>{
      setMessages(res.data);
    })
    axios.get('/users/all').then((res)=>{
      setUsers(res.data.users);
    }).catch(err=>console.log(err))
    scrollToBottom()
  },[change]);
  return (
    <main className="h-screen w-screen flex ">
      <section className="left min-h-screen relative flex flex-col min-w-96 bg-slate-300">
        <header className="flex justify-between items-center px-4 p-2 w-full bg-slate-100 absolute top-0">
          <button className="flex gap-2" onClick={()=>setIsModalOpen(!isModalOpen)}>
            <i className="ri-add-fill mr-1"></i>
            <p>Add Collaborator</p>
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
                    return <div key={_id} className={`message max-w-56 flex flex-col p-2 bg-slate-50 w-fit rounded-md`}>
                      <small className="opacity-65 test-xs">Ai</small>
                      <p className="text-sm">
                        {text_message}
                      </p>
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
            />
            <button onClick={()=>{sendMessage()}}  className="px-5 bg-slate-950 text-white">
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
              project.users && project.users.map((user)=>(
                <div key={user._id} className="user cursor-pointer hover:bg-slate-200 p-2 flex gap-2 items-center">
                  <div className="aspect-square w-fit h-fit text-white flex justify-center items-center rounded-full bg-slate-500 p-5">
                    <i className="ri-user-fill absolute"></i>
                  </div>
                  <h1 className="font-semibold text-lg">{user.email}</h1>
                </div>
              ))
            }
            
          </div>
        </div>
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
