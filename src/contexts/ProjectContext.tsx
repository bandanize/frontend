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
  createSong: (projectId: string, listId: string, song: Omit<Song, 'id' | 'tablatures' | 'files'>) => void;
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
        members: band.members.map((m: any) => ({
          id: String(m.id),
          name: m.name,
          email: m.email
        })),
        songLists: [], // Not supported by backend yet
        chat: [], // Not supported by backend yet
        createdAt: new Date(), // Not returned by backend yet
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

  const sendMessage = (projectId: string, message: string) => {
    if (!user) return;
    const mentions = message.match(/@\w+/g) || [];
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      userId: user.id,
      userName: user.name,
      message,
      timestamp: new Date(),
      mentions: mentions.map(m => m.substring(1)),
    };
    updateLocalProject(projectId, (p) => ({ ...p, chat: [...p.chat, newMessage] }));
  };

  const createSongList = (projectId: string, name: string) => {
    const newList: SongList = { id: Date.now().toString(), name, songs: [] };
    updateLocalProject(projectId, (p) => ({ ...p, songLists: [...p.songLists, newList] }));
  };

  const updateSongList = (projectId: string, listId: string, name: string) => {
    updateLocalProject(projectId, (p) => ({
      ...p,
      songLists: p.songLists.map(l => l.id === listId ? { ...l, name } : l)
    }));
  };

  const deleteSongList = (projectId: string, listId: string) => {
    updateLocalProject(projectId, (p) => ({
      ...p,
      songLists: p.songLists.filter(l => l.id !== listId)
    }));
  };

  const createSong = (projectId: string, listId: string, song: Omit<Song, 'id' | 'tablatures' | 'files'>) => {
    const newSong: Song = { ...song, id: Date.now().toString(), tablatures: [], files: [] };
    updateLocalProject(projectId, (p) => ({
      ...p,
      songLists: p.songLists.map(l => l.id === listId ? { ...l, songs: [...l.songs, newSong] } : l)
    }));
  };

  const updateSong = (projectId: string, listId: string, songId: string, data: Partial<Song>) => {
    updateLocalProject(projectId, (p) => ({
      ...p,
      songLists: p.songLists.map(l => l.id === listId ? {
        ...l,
        songs: l.songs.map(s => s.id === songId ? { ...s, ...data } : s)
      } : l)
    }));
  };

  const deleteSong = (projectId: string, listId: string, songId: string) => {
    updateLocalProject(projectId, (p) => ({
      ...p,
      songLists: p.songLists.map(l => l.id === listId ? {
        ...l,
        songs: l.songs.filter(s => s.id !== songId)
      } : l)
    }));
  };
  
  const addSongFile = (projectId: string, listId: string, songId: string, file: Omit<MediaFile, 'id'>) => {
    // Mock implementation
  };
  
  const createTablature = (projectId: string, listId: string, songId: string, tablature: Omit<Tablature, 'id' | 'files'>) => {
     // Mock implementation
  };
  
  const updateTablature = (projectId: string, listId: string, songId: string, tabId: string, data: Partial<Tablature>) => {
      // Mock implementation
  };
  
  const deleteTablature = (projectId: string, listId: string, songId: string, tabId: string) => {
      // Mock implementation
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