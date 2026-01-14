import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

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
  createProject: (name: string, description: string, imageUrl?: string) => void;
  updateProject: (projectId: string, data: Partial<Project>) => void;
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

  useEffect(() => {
    if (user) {
      const storedProjects = localStorage.getItem(`projects_${user.id}`);
      if (storedProjects) {
        const parsed = JSON.parse(storedProjects);
        // Convert date strings back to Date objects
        const projectsWithDates = parsed.map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          chat: p.chat.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
        }));
        setProjects(projectsWithDates);
      }
    }
  }, [user]);

  useEffect(() => {
    if (user && projects.length > 0) {
      localStorage.setItem(`projects_${user.id}`, JSON.stringify(projects));
    }
  }, [projects, user]);

  const createProject = (name: string, description: string, imageUrl?: string) => {
    if (!user) return;

    const newProject: Project = {
      id: Date.now().toString(),
      name,
      description,
      imageUrl,
      ownerId: user.id,
      members: [{ id: user.id, name: user.name, email: user.email }],
      songLists: [],
      chat: [],
      createdAt: new Date(),
    };

    setProjects([...projects, newProject]);
  };

  const updateProject = (projectId: string, data: Partial<Project>) => {
    setProjects(projects.map(p => {
      if (p.id === projectId) {
        return { ...p, ...data };
      }
      return p;
    }));

    if (currentProject?.id === projectId) {
      setCurrentProject({ ...currentProject, ...data });
    }
  };

  const selectProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    setCurrentProject(project || null);
  };

  const addMember = (projectId: string, email: string) => {
    // Simulated - would normally look up user by email
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const foundUser = users.find((u: any) => u.email === email);
    
    if (!foundUser) {
      throw new Error('Usuario no encontrado');
    }

    setProjects(projects.map(p => {
      if (p.id === projectId) {
        const member: Member = {
          id: foundUser.id,
          name: foundUser.name,
          email: foundUser.email,
        };
        return { ...p, members: [...p.members, member] };
      }
      return p;
    }));
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

    setProjects(projects.map(p => {
      if (p.id === projectId) {
        return { ...p, chat: [...p.chat, newMessage] };
      }
      return p;
    }));

    if (currentProject?.id === projectId) {
      setCurrentProject({ ...currentProject, chat: [...currentProject.chat, newMessage] });
    }
  };

  const createSongList = (projectId: string, name: string) => {
    const newList: SongList = {
      id: Date.now().toString(),
      name,
      songs: [],
    };

    setProjects(projects.map(p => {
      if (p.id === projectId) {
        return { ...p, songLists: [...p.songLists, newList] };
      }
      return p;
    }));

    if (currentProject?.id === projectId) {
      setCurrentProject({ ...currentProject, songLists: [...currentProject.songLists, newList] });
    }
  };

  const updateSongList = (projectId: string, listId: string, name: string) => {
    setProjects(projects.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          songLists: p.songLists.map(l => {
            if (l.id === listId) {
              return { ...l, name };
            }
            return l;
          })
        };
      }
      return p;
    }));

    if (currentProject?.id === projectId) {
      setCurrentProject({
        ...currentProject,
        songLists: currentProject.songLists.map(l => {
          if (l.id === listId) {
            return { ...l, name };
          }
          return l;
        })
      });
    }
  };

  const deleteSongList = (projectId: string, listId: string) => {
    setProjects(projects.map(p => {
      if (p.id === projectId) {
        return { ...p, songLists: p.songLists.filter(l => l.id !== listId) };
      }
      return p;
    }));

    if (currentProject?.id === projectId) {
      setCurrentProject({ ...currentProject, songLists: currentProject.songLists.filter(l => l.id !== listId) });
    }
  };

  const createSong = (projectId: string, listId: string, song: Omit<Song, 'id' | 'tablatures' | 'files'>) => {
    const newSong: Song = {
      ...song,
      id: Date.now().toString(),
      tablatures: [],
      files: [],
    };

    setProjects(projects.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          songLists: p.songLists.map(l => {
            if (l.id === listId) {
              return { ...l, songs: [...l.songs, newSong] };
            }
            return l;
          })
        };
      }
      return p;
    }));

    if (currentProject?.id === projectId) {
      setCurrentProject({
        ...currentProject,
        songLists: currentProject.songLists.map(l => {
          if (l.id === listId) {
            return { ...l, songs: [...l.songs, newSong] };
          }
          return l;
        })
      });
    }
  };

  const updateSong = (projectId: string, listId: string, songId: string, data: Partial<Song>) => {
    setProjects(projects.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          songLists: p.songLists.map(l => {
            if (l.id === listId) {
              return {
                ...l,
                songs: l.songs.map(s => s.id === songId ? { ...s, ...data } : s)
              };
            }
            return l;
          })
        };
      }
      return p;
    }));

    if (currentProject?.id === projectId) {
      setCurrentProject({
        ...currentProject,
        songLists: currentProject.songLists.map(l => {
          if (l.id === listId) {
            return {
              ...l,
              songs: l.songs.map(s => s.id === songId ? { ...s, ...data } : s)
            };
          }
          return l;
        })
      });
    }
  };

  const deleteSong = (projectId: string, listId: string, songId: string) => {
    setProjects(projects.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          songLists: p.songLists.map(l => {
            if (l.id === listId) {
              return { ...l, songs: l.songs.filter(s => s.id !== songId) };
            }
            return l;
          })
        };
      }
      return p;
    }));

    if (currentProject?.id === projectId) {
      setCurrentProject({
        ...currentProject,
        songLists: currentProject.songLists.map(l => {
          if (l.id === listId) {
            return { ...l, songs: l.songs.filter(s => s.id !== songId) };
          }
          return l;
        })
      });
    }
  };

  const addSongFile = (projectId: string, listId: string, songId: string, file: Omit<MediaFile, 'id'>) => {
    const newFile: MediaFile = { ...file, id: Date.now().toString() };
    
    setProjects(projects.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          songLists: p.songLists.map(l => {
            if (l.id === listId) {
              return {
                ...l,
                songs: l.songs.map(s => {
                  if (s.id === songId) {
                    return { ...s, files: [...s.files, newFile] };
                  }
                  return s;
                })
              };
            }
            return l;
          })
        };
      }
      return p;
    }));

    if (currentProject?.id === projectId) {
      setCurrentProject({
        ...currentProject,
        songLists: currentProject.songLists.map(l => {
          if (l.id === listId) {
            return {
              ...l,
              songs: l.songs.map(s => {
                if (s.id === songId) {
                  return { ...s, files: [...s.files, newFile] };
                }
                return s;
              })
            };
          }
          return l;
        })
      });
    }
  };

  const createTablature = (projectId: string, listId: string, songId: string, tablature: Omit<Tablature, 'id' | 'files'>) => {
    const newTab: Tablature = {
      ...tablature,
      id: Date.now().toString(),
      files: [],
    };

    setProjects(projects.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          songLists: p.songLists.map(l => {
            if (l.id === listId) {
              return {
                ...l,
                songs: l.songs.map(s => {
                  if (s.id === songId) {
                    return { ...s, tablatures: [...s.tablatures, newTab] };
                  }
                  return s;
                })
              };
            }
            return l;
          })
        };
      }
      return p;
    }));

    if (currentProject?.id === projectId) {
      setCurrentProject({
        ...currentProject,
        songLists: currentProject.songLists.map(l => {
          if (l.id === listId) {
            return {
              ...l,
              songs: l.songs.map(s => {
                if (s.id === songId) {
                  return { ...s, tablatures: [...s.tablatures, newTab] };
                }
                return s;
              })
            };
          }
          return l;
        })
      });
    }
  };

  const updateTablature = (projectId: string, listId: string, songId: string, tabId: string, data: Partial<Tablature>) => {
    setProjects(projects.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          songLists: p.songLists.map(l => {
            if (l.id === listId) {
              return {
                ...l,
                songs: l.songs.map(s => {
                  if (s.id === songId) {
                    return {
                      ...s,
                      tablatures: s.tablatures.map(t => t.id === tabId ? { ...t, ...data } : t)
                    };
                  }
                  return s;
                })
              };
            }
            return l;
          })
        };
      }
      return p;
    }));

    if (currentProject?.id === projectId) {
      setCurrentProject({
        ...currentProject,
        songLists: currentProject.songLists.map(l => {
          if (l.id === listId) {
            return {
              ...l,
              songs: l.songs.map(s => {
                if (s.id === songId) {
                  return {
                    ...s,
                    tablatures: s.tablatures.map(t => t.id === tabId ? { ...t, ...data } : t)
                  };
                }
                return s;
              })
            };
          }
          return l;
        })
      });
    }
  };

  const deleteTablature = (projectId: string, listId: string, songId: string, tabId: string) => {
    setProjects(projects.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          songLists: p.songLists.map(l => {
            if (l.id === listId) {
              return {
                ...l,
                songs: l.songs.map(s => {
                  if (s.id === songId) {
                    return { ...s, tablatures: s.tablatures.filter(t => t.id !== tabId) };
                  }
                  return s;
                })
              };
            }
            return l;
          })
        };
      }
      return p;
    }));

    if (currentProject?.id === projectId) {
      setCurrentProject({
        ...currentProject,
        songLists: currentProject.songLists.map(l => {
          if (l.id === listId) {
            return {
              ...l,
              songs: l.songs.map(s => {
                if (s.id === songId) {
                  return { ...s, tablatures: s.tablatures.filter(t => t.id !== tabId) };
                }
                return s;
              })
            };
          }
          return l;
        })
      });
    }
  };

  const addTablatureFile = (projectId: string, listId: string, songId: string, tabId: string, file: Omit<MediaFile, 'id'>) => {
    const newFile: MediaFile = { ...file, id: Date.now().toString() };
    
    setProjects(projects.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          songLists: p.songLists.map(l => {
            if (l.id === listId) {
              return {
                ...l,
                songs: l.songs.map(s => {
                  if (s.id === songId) {
                    return {
                      ...s,
                      tablatures: s.tablatures.map(t => {
                        if (t.id === tabId) {
                          return { ...t, files: [...t.files, newFile] };
                        }
                        return t;
                      })
                    };
                  }
                  return s;
                })
              };
            }
            return l;
          })
        };
      }
      return p;
    }));

    if (currentProject?.id === projectId) {
      setCurrentProject({
        ...currentProject,
        songLists: currentProject.songLists.map(l => {
          if (l.id === listId) {
            return {
              ...l,
              songs: l.songs.map(s => {
                if (s.id === songId) {
                  return {
                    ...s,
                    tablatures: s.tablatures.map(t => {
                      if (t.id === tabId) {
                        return { ...t, files: [...t.files, newFile] };
                      }
                      return t;
                    })
                  };
                }
                return s;
              })
            };
          }
          return l;
        })
      });
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