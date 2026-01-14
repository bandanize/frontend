import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from '@/services/api';

export interface Member {
  id: string;
  name: string;
  email: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  mentions: string[];
}

export interface MediaFile {
  id: string;
  name: string;
  type: string;
  url: string;
}

export interface Tablature {
  id: string;
  instrument: string;
  instrumentIcon: string;
  name: string;
  tuning: string;
  content: string;
  files: MediaFile[];
}

export interface Song {
  id: string;
  name: string;
  bandName: string;
  originalBand?: string;
  bpm: number;
  key: string;
  files: MediaFile[];
  tablatures: Tablature[];
}

export interface SongList {
  id: string;
  name: string;
  songs: Song[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  ownerId: string;
  members: Member[];
  songLists: SongList[];
  chat: ChatMessage[];
  createdAt: Date;
}

interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  createProject: (name: string, description: string, imageUrl?: string) => Promise<void>;
  updateProject: (projectId: string, data: Partial<Project>) => Promise<void>;
  selectProject: (projectId: string) => void;
  addMember: (projectId: string, email: string) => void;
  sendMessage: (projectId: string, message: string) => void;
  createSongList: (projectId: string, name: string) => void;
  updateSongList: (projectId: string, listId: string, name: string) => void;
  deleteSongList: (projectId: string, listId: string) => void;
  createSong: (projectId: string, listId: string, song: Omit<Song, 'id' | 'tablatures' | 'files' | 'bandName'>) => void;
  updateSong: (projectId: string, listId: string, songId: string, data: Partial<Song>) => void;
  deleteSong: (projectId: string, listId: string, songId: string) => void;
  addSongFile: (projectId: string, listId: string, songId: string, file: Omit<MediaFile, 'id'>) => void;
  createTablature: (projectId: string, listId: string, songId: string, tablature: Omit<Tablature, 'id' | 'files'>) => void;
  updateTablature: (projectId: string, listId: string, songId: string, tabId: string, data: Partial<Tablature>) => void;
  deleteTablature: (projectId: string, listId: string, songId: string, tabId: string) => void;
  addTablatureFile: (projectId: string, listId: string, songId: string, tabId: string, file: Omit<MediaFile, 'id'>) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  // Fetch projects from API
  useEffect(() => {
    if (user) {
      fetchProjects();
    } else {
      setProjects([]);
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/bands/my-bands');
      // Map API response to Project interface
      const mappedProjects: Project[] = response.data.map((band: any) => ({
        id: String(band.id),
        name: band.name,
        description: band.description,
        imageUrl: band.photo,
        ownerId: user?.id || '', // ownerId is not returned, assume current user for now or irrelevant
        members: band.members ? band.members.map((m: any) => ({
          id: String(m.id),
          name: m.name,
          email: m.email
        })) : band.users ? band.users.map((u: any) => ({ // Fallback if backend returns users list
          id: String(u.id),
          name: u.name,
          email: u.email
        })) : [],
        songLists: band.songLists ? band.songLists.map((list: any) => ({
          id: String(list.id),
          name: list.name,
          songs: list.songs ? list.songs.map((song: any) => ({
            id: String(song.id),
            name: song.name,
            bandName: band.name,
            originalBand: song.originalBand,
            bpm: song.bpm,
            key: song.songKey,
            files: song.files || [],
            tablatures: song.tablatures ? song.tablatures.map((tab: any) => ({
              id: String(tab.id),
              name: tab.name,
              instrument: tab.instrument,
              instrumentIcon: tab.instrumentIcon,
              tuning: tab.tuning,
              content: tab.content,
              files: tab.files || []
            })) : []
          })) : []
        })) : [],
        chat: band.chatMessages ? band.chatMessages.map((msg: any) => ({
          id: String(msg.id),
          userId: msg.sender ? String(msg.sender.id) : 'unknown',
          userName: msg.sender ? msg.sender.name : 'Unknown User',
          message: msg.message || '',
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
          mentions: [] 
        })) : [],
        createdAt: new Date(),
      }));
      setProjects(mappedProjects);
    } catch (error) {
      console.error("Error fetching projects", error);
    }
  };

  const createProject = async (name: string, description: string, imageUrl?: string) => {
    if (!user) return;

    try {
      const bandData = {
        name,
        description,
        photo: imageUrl,
        genre: 'Unknown', // Default
        city: 'Unknown' // Default
      };
      
      const response = await api.post(`/bands/create/${user.id}`, bandData);
      const newBand = response.data;
      
      const newProject: Project = {
        id: String(newBand.id),
        name: newBand.name,
        description: newBand.description,
        imageUrl: newBand.photo,
        ownerId: user.id,
        members: newBand.members ? newBand.members.map((m: any) => ({
            id: String(m.id),
            name: m.name,
            email: m.email
        })) : [{ id: user.id, name: user.name, email: user.email }],
        songLists: [],
        chat: [],
        createdAt: new Date(),
      };

      setProjects([...projects, newProject]);
    } catch (error) {
      console.error("Error creating project", error);
    }
  };

  const updateProject = async (projectId: string, data: Partial<Project>) => {
    try {
        const bandData: any = {};
        if (data.name) bandData.name = data.name;
        if (data.description) bandData.description = data.description;
        if (data.imageUrl) bandData.photo = data.imageUrl;

        const response = await api.put(`/bands/${projectId}`, bandData);
        // Optimize: just update local state instead of refetching or use response
        
        setProjects(projects.map(p => {
            if (p.id === projectId) {
              return { ...p, ...data };
            }
            return p;
          }));
      
          if (currentProject?.id === projectId) {
            setCurrentProject({ ...currentProject, ...data });
          }
    } catch (error) {
        console.error("Error updating project", error);
    }
  };

  const selectProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    setCurrentProject(project || null);
  };

  // --- The following functions are LOCAL ONLY/MOCK as backend doesn't support them yet ---
  const addMember = (projectId: string, email: string) => {
    console.warn("addMember: Backend does not support adding members by email yet via this context.");
  };

  const sendMessage = async (projectId: string, message: string) => {
    if (!user) return;
    try {
        const response = await api.post(`/bands/${projectId}/chat`, {
            userId: user.id,
            message: message
        });
        const msg = response.data;
        const newMessage: ChatMessage = {
          id: String(msg.id),
          userId: msg.sender ? String(msg.sender.id) : 'unknown',
          userName: msg.sender ? msg.sender.name : 'Unknown User',
          message: msg.message || '',
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
          mentions: [],
        };
        updateLocalProject(projectId, (p) => ({ ...p, chat: [...p.chat, newMessage] }));
    } catch (error) {
        console.error("Error sending message", error);
    }
  };

  const createSongList = async (projectId: string, name: string) => {
    try {
        const response = await api.post(`/bands/${projectId}/songlists`, { name });
        const list = response.data;
        const newList: SongList = { id: String(list.id), name: list.name, songs: [] };
        updateLocalProject(projectId, (p) => ({ ...p, songLists: [...p.songLists, newList] }));
    } catch (error) {
        console.error("Error creating song list", error);
    }
  };

  const updateSongList = async (projectId: string, listId: string, name: string) => {
    try {
        await api.put(`/songlists/${listId}`, { name });
        updateLocalProject(projectId, (p) => ({
          ...p,
          songLists: p.songLists.map(l => l.id === listId ? { ...l, name } : l)
        }));
    } catch(error) { console.error("Error updating song list", error); }
  };

  const deleteSongList = async (projectId: string, listId: string) => {
    try {
        await api.delete(`/songlists/${listId}`);
        updateLocalProject(projectId, (p) => ({
          ...p,
          songLists: p.songLists.filter(l => l.id !== listId)
        }));
    } catch(error) { console.error("Error deleting song list", error); }
  };

  const createSong = async (projectId: string, listId: string, song: Omit<Song, 'id' | 'tablatures' | 'files' | 'bandName'>) => {
    try {
        const payload = {
            name: song.name,
            bpm: song.bpm,
            songKey: song.key,
            originalBand: song.originalBand
        };
        const response = await api.post(`/songlists/${listId}/songs`, payload);
        const s = response.data;
        const newSong: Song = { 
            id: String(s.id), 
            name: s.name, 
            bandName: '', // Backend doesn't return this in SongModel, and it's redundant here
            originalBand: s.originalBand,
            bpm: s.bpm, 
            key: s.songKey, 
            tablatures: [], 
            files: [] 
        };
        updateLocalProject(projectId, (p) => ({
          ...p,
          songLists: p.songLists.map(l => l.id === listId ? { ...l, songs: [...l.songs, newSong] } : l)
        }));
    } catch (error) {
        console.error("Error creating song", error);
    }
  };

  const updateSong = async (projectId: string, listId: string, songId: string, data: Partial<Song>) => {
    try {
        const payload: any = {};
        if (data.name) payload.name = data.name;
        if (data.bpm) payload.bpm = data.bpm;
        if (data.key) payload.songKey = data.key;
        if (data.originalBand) payload.originalBand = data.originalBand;
        
        await api.put(`/songs/${songId}`, payload);
        
        updateLocalProject(projectId, (p) => ({
          ...p,
          songLists: p.songLists.map(l => l.id === listId ? {
            ...l,
            songs: l.songs.map(s => s.id === songId ? { ...s, ...data } : s)
          } : l)
        }));
    } catch (error) { console.error("Error updating song", error); }
  };

  const deleteSong = async (projectId: string, listId: string, songId: string) => {
    try {
        await api.delete(`/songs/${songId}`);
        updateLocalProject(projectId, (p) => ({
          ...p,
          songLists: p.songLists.map(l => l.id === listId ? {
            ...l,
            songs: l.songs.filter(s => s.id !== songId)
          } : l)
        }));
    } catch (error) { console.error("Error deleting song", error); }
  };
  
  const addSongFile = (projectId: string, listId: string, songId: string, file: Omit<MediaFile, 'id'>) => {
    // Mock implementation
  };
  
  const createTablature = async (projectId: string, listId: string, songId: string, tablature: Omit<Tablature, 'id' | 'files'>) => {
    try {
        const response = await api.post(`/songs/${songId}/tabs`, tablature);
        const t = response.data;
        const newTab: Tablature = {
             id: String(t.id),
             name: t.name,
             instrument: t.instrument,
             instrumentIcon: t.instrumentIcon,
             tuning: t.tuning,
             content: t.content,
             files: []
        };
        // Update local state is tricky purely for deep nesting, but simpler if we just fetch fresh project data or update deeply
        // For now, deep update:
         updateLocalProject(projectId, (p) => ({
          ...p,
          songLists: p.songLists.map(l => l.id === listId ? {
            ...l,
            songs: l.songs.map(s => s.id === songId ? { 
                ...s, 
                tablatures: [...s.tablatures, newTab]
            } : s)
          } : l)
        }));
    } catch (error) { console.error("Error creating tablature", error); }
  };
  
  const updateTablature = async (projectId: string, listId: string, songId: string, tabId: string, data: Partial<Tablature>) => {
      try {
          await api.put(`/tabs/${tabId}`, data);
           updateLocalProject(projectId, (p) => ({
            ...p,
            songLists: p.songLists.map(l => l.id === listId ? {
                ...l,
                songs: l.songs.map(s => s.id === songId ? { 
                    ...s, 
                    tablatures: s.tablatures.map(t => t.id === tabId ? { ...t, ...data } : t)
                } : s)
            } : l)
            }));
      } catch (error) { console.error("Error updating tablature", error); }
  };
  
  const deleteTablature = async (projectId: string, listId: string, songId: string, tabId: string) => {
      try {
          await api.delete(`/tabs/${tabId}`);
           updateLocalProject(projectId, (p) => ({
            ...p,
            songLists: p.songLists.map(l => l.id === listId ? {
                ...l,
                songs: l.songs.map(s => s.id === songId ? { 
                    ...s, 
                    tablatures: s.tablatures.filter(t => t.id !== tabId)
                } : s)
            } : l)
            }));
      } catch (error) { console.error("Error deleting tablature", error); }
  };
  
  const addTablatureFile = (projectId: string, listId: string, songId: string, tabId: string, file: Omit<MediaFile, 'id'>) => {
      // Mock implementation
  };

  // Helper to update local state
  const updateLocalProject = (projectId: string, updater: (p: Project) => Project) => {
    setProjects(projects.map(p => {
      if (p.id === projectId) {
        return updater(p);
      }
      return p;
    }));
    if (currentProject?.id === projectId) {
      setCurrentProject(updater(currentProject));
    }
  };

  return (
    <ProjectContext.Provider value={{
      projects,
      currentProject,
      createProject,
      updateProject,
      selectProject,
      addMember,
      sendMessage,
      createSongList,
      updateSongList,
      deleteSongList,
      createSong,
      updateSong,
      deleteSong,
      addSongFile,
      createTablature,
      updateTablature,
      deleteTablature,
      addTablatureFile,
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
}