import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export type MenuSection = 'image' | 'video' | 'labs' | 'settings';
export type ModuleType = 
  | 'landing'
  | 'gallery'
  | 'image-catalog'
  | 'model-admin'
  | 'motion-control' 
  | 'kling-motion-control-pixazo'
  | 'nano-banana-gen' 
  | 'nano-banana-edit' 
  | 'nano-banana-pro' 
  | 'qwen-text-to-image'
  | 'qwen-image-to-image'
  | 'z-image' 
  | 'flux2-pro-text' 
  | 'flux2-pro-image' 
  | 'flux2-flex-text' 
  | 'flux2-flex-image' 
  | 'flux-schnell'
  | 'stable-diffusion-text'
  | 'stable-diffusion-inpaint'
  | 'sora2-characters'
  | 'sora2-text-to-video'
  | 'sora2-image-to-video'
  | 'sora2-pro-text-to-video'
  | 'sora2-pro-image-to-video'
  | 'veo3-text-to-video'
  | 'veo3-image-to-video'
  | 'veo3-reference-to-video'
  | 'spaces'
  | 'grok-image-to-video'
  | 'grok-image-to-image'
  | 'grok-text-to-image'
  | 'grok-upscale';

interface SubMenuItem {
  id: ModuleType;
  label: string;
  group?: string;
}

interface MenuItem {
  id: ModuleType;
  icon: React.ReactNode;
  label: string;
  section?: MenuSection;
  subItems?: SubMenuItem[];
}

interface SidebarProps {
  activeModule: ModuleType;
  expandedSection: MenuSection | null;
  onModuleChange: (module: ModuleType) => void;
  onSectionToggle: (section: MenuSection) => void;
  onSettingsClick: () => void;
  onLogout: () => void;
  userEmail?: string;
  apiConnected: boolean;
  isAdmin: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  expandedSection,
  onModuleChange,
  onSectionToggle,
  onSettingsClick,
  onLogout,
  userEmail,
  apiConnected,
  isAdmin,
}) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  // Auto expand when hovered, collapse when not
  const sidebarExpanded = !isCollapsed || isHovered;

  const menuItems: MenuItem[] = [
    {
      id: 'gallery',
      label: 'GALLERY',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      ),
    },
    {
      id: 'image-catalog',
      label: 'IMAGE',
      section: 'image',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: 'motion-control',
      label: 'VIDEO',
      section: 'video',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      subItems: [
        { id: 'motion-control', label: 'Kling Motion Control', group: 'KIE AI' },
        { id: 'kling-motion-control-pixazo', label: 'Kling 2.6 Motion Control', group: 'PIXAZO' },
        { id: 'sora2-characters', label: 'Characters', group: 'SORA 2' },
        { id: 'sora2-text-to-video', label: 'Text to Video', group: 'SORA 2' },
        { id: 'sora2-image-to-video', label: 'Image to Video', group: 'SORA 2' },
        { id: 'sora2-pro-text-to-video', label: 'Pro Text to Video', group: 'SORA 2 PRO' },
        { id: 'sora2-pro-image-to-video', label: 'Pro Image to Video', group: 'SORA 2 PRO' },
        { id: 'veo3-text-to-video', label: 'Text to Video', group: 'VEO 3.1' },
        { id: 'veo3-image-to-video', label: 'Image to Video', group: 'VEO 3.1' },
        { id: 'veo3-reference-to-video', label: 'Reference to Video', group: 'VEO 3.1' },
        { id: 'grok-image-to-video', label: 'Image to Video', group: 'GROK' },
      ],
    },
    {
      id: 'flux-schnell',
      label: 'LABS',
      section: 'labs',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
      subItems: [
        { id: 'flux-schnell', label: 'Flux Schnell (Free)', group: 'PIXAZO' },
        { id: 'stable-diffusion-text', label: 'Stable Diffusion Text-to-Image', group: 'PIXAZO' },
        { id: 'stable-diffusion-inpaint', label: 'Stable Diffusion Inpainting', group: 'PIXAZO' },
      ],
    },
    {
      id: 'model-admin',
      label: 'CATALOG',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
    },
    {
      id: 'spaces',
      label: 'SPACES',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 12h10M4 18h16" />
        </svg>
      ),
    },
  ];

  // Check if a module belongs to a section
  const isModuleInSection = (module: ModuleType, section: MenuSection): boolean => {
    switch (section) {
      case 'image':
        return [
          'image-catalog',
          'nano-banana-gen',
          'nano-banana-edit',
          'nano-banana-pro',
          'qwen-text-to-image',
          'qwen-image-to-image',
          'z-image',
          'flux2-pro-text',
          'flux2-pro-image',
          'flux2-flex-text',
          'flux2-flex-image',
          'grok-text-to-image',
          'grok-image-to-image',
          'grok-upscale',
        ].includes(module);
      case 'video':
        return [
          'motion-control',
          'kling-motion-control-pixazo',
          'sora2-characters',
          'sora2-text-to-video',
          'sora2-image-to-video',
          'sora2-pro-text-to-video',
          'sora2-pro-image-to-video',
          'veo3-text-to-video',
          'veo3-image-to-video',
          'veo3-reference-to-video',
          'grok-image-to-video',
        ].includes(module);
      case 'labs':
        return ['flux-schnell', 'stable-diffusion-text', 'stable-diffusion-inpaint'].includes(module);
      default:
        return false;
    }
  };

  // Group subItems by group
  const groupSubItems = (subItems: SubMenuItem[]) => {
    const groups: { [key: string]: SubMenuItem[] } = {};
    const noGroup: SubMenuItem[] = [];
    
    subItems.forEach(item => {
      if (item.group) {
        if (!groups[item.group]) {
          groups[item.group] = [];
        }
        groups[item.group].push(item);
      } else {
        noGroup.push(item);
      }
    });
    
    return { groups, noGroup };
  };

  const visibleMenuItems = menuItems
    .filter((item) => {
      if (!isAdmin && item.section === 'labs') return false;
      if (!isAdmin && item.id === 'model-admin') return false;
      return true;
    })
    .map((item) => {
      if (item.section === 'video' && item.subItems) {
        const subItems = isAdmin ? item.subItems : item.subItems.filter((sub) => sub.id !== 'kling-motion-control-pixazo');
        return { ...item, subItems };
      }
      return item;
    });

  return (
    <aside 
      className={`h-screen flex flex-col fixed left-0 top-0 z-50 border-r transition-all duration-300 ${
        isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'
      } ${sidebarExpanded ? 'w-56' : 'w-16'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo & Collapse Toggle */}
      <div className={`h-16 flex items-center border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'} ${sidebarExpanded ? 'px-4 gap-3' : 'justify-center'}`}>
        <div className="w-10 h-10 bg-orange-500 flex items-center justify-center font-black text-black text-xl flex-shrink-0">
          Z
        </div>
        {sidebarExpanded && (
          <div className="flex-1 min-w-0">
            <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-zinc-900'}`}>ZWAPP</div>
            <div className={`text-[10px] font-mono ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>ENGINE v2.0</div>
          </div>
        )}
        {sidebarExpanded && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-1.5 rounded transition-colors ${
              isDark ? 'hover:bg-zinc-800 text-zinc-500' : 'hover:bg-zinc-100 text-zinc-400'
            }`}
            title={isCollapsed ? 'Pin sidebar' : 'Auto-collapse sidebar'}
          >
            <svg className={`w-4 h-4 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden">
        {visibleMenuItems.map((item) => {
          const isActive = activeModule === item.id || 
            (item.section && isModuleInSection(activeModule, item.section));
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isExpanded = item.section && expandedSection === item.section && sidebarExpanded;

          return (
            <div key={item.id} className="mb-1">
              {/* Main Menu Button */}
              <button
                onClick={() => {
                  if (hasSubItems && item.section) {
                    onSectionToggle(item.section);
                  } else {
                    onModuleChange(item.id);
                  }
                }}
                className={`w-full flex items-center gap-3 transition-all ${
                  sidebarExpanded ? 'px-4 py-3' : 'px-0 py-3 justify-center'
                } ${
                  isActive
                    ? isDark 
                      ? 'text-orange-500 bg-orange-500/10 border-l-2 border-orange-500' 
                      : 'text-orange-600 bg-orange-50 border-l-2 border-orange-500'
                    : isDark
                      ? 'text-zinc-400 hover:text-white hover:bg-zinc-900 border-l-2 border-transparent'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border-l-2 border-transparent'
                }`}
                title={!sidebarExpanded ? item.label : undefined}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {sidebarExpanded && (
                  <>
                    <span className="flex-1 text-left text-xs font-mono tracking-wider">{item.label}</span>
                    {hasSubItems && (
                      <svg 
                        className={`w-4 h-4 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </>
                )}
              </button>

              {/* Expanded Submenu */}
              {hasSubItems && isExpanded && item.subItems && (
                <div className={`mt-1 ml-4 border-l ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                  {(() => {
                    const { groups, noGroup } = groupSubItems(item.subItems);
                    const elements: React.ReactNode[] = [];
                    
                    noGroup.forEach(subItem => {
                      elements.push(
                        <button
                          key={subItem.id}
                          onClick={() => onModuleChange(subItem.id)}
                          className={`w-full pl-4 pr-3 py-2 text-left text-xs font-mono transition-colors flex items-center gap-2 ${
                            activeModule === subItem.id
                              ? isDark
                                ? 'text-orange-500 bg-orange-500/5'
                                : 'text-orange-600 bg-orange-50'
                              : isDark
                                ? 'text-zinc-500 hover:text-white hover:bg-zinc-900'
                                : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            activeModule === subItem.id ? 'bg-orange-500' : isDark ? 'bg-zinc-700' : 'bg-zinc-300'
                          }`} />
                          <span className="truncate">{subItem.label}</span>
                        </button>
                      );
                    });
                    
                    Object.entries(groups).forEach(([groupName, groupItems]) => {
                      elements.push(
                        <div key={groupName} className="mt-2 first:mt-0">
                          <div className={`pl-4 py-1 text-[9px] font-mono tracking-widest ${
                            isDark ? 'text-zinc-600' : 'text-zinc-400'
                          }`}>
                            {groupName}
                          </div>
                          {groupItems.map(subItem => (
                            <button
                              key={subItem.id}
                              onClick={() => onModuleChange(subItem.id)}
                              className={`w-full pl-4 pr-3 py-2 text-left text-xs font-mono transition-colors flex items-center gap-2 ${
                                activeModule === subItem.id
                                  ? isDark
                                    ? 'text-orange-500 bg-orange-500/5'
                                    : 'text-orange-600 bg-orange-50'
                                  : isDark
                                    ? 'text-zinc-500 hover:text-white hover:bg-zinc-900'
                                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                activeModule === subItem.id ? 'bg-orange-500' : isDark ? 'bg-zinc-700' : 'bg-zinc-300'
                              }`} />
                              <span className="truncate">{subItem.label}</span>
                            </button>
                          ))}
                        </div>
                      );
                    });
                    
                    return elements;
                  })()}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className={`py-3 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'} ${sidebarExpanded ? 'px-4 space-y-1' : 'px-2 space-y-1'}`}>
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`w-full flex items-center gap-3 rounded transition-colors text-xs font-mono ${
            sidebarExpanded ? 'px-3 py-2' : 'p-2 justify-center'
          } ${
            isDark 
              ? 'text-zinc-500 hover:text-white hover:bg-zinc-900' 
              : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
          title={!sidebarExpanded ? (isDark ? 'Light Mode' : 'Dark Mode') : undefined}
        >
          {isDark ? (
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
          {sidebarExpanded && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        {/* Settings */}
        <button
          onClick={onSettingsClick}
          className={`w-full flex items-center gap-3 rounded transition-colors text-xs font-mono ${
            sidebarExpanded ? 'px-3 py-2' : 'p-2 justify-center'
          } ${
            isDark 
              ? 'text-zinc-500 hover:text-white hover:bg-zinc-900' 
              : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
          title={!sidebarExpanded ? 'Settings' : undefined}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {sidebarExpanded && <span>Settings</span>}
        </button>

        {/* Logout */}
        <button
          onClick={onLogout}
          className={`w-full flex items-center gap-3 rounded transition-colors text-xs font-mono ${
            sidebarExpanded ? 'px-3 py-2' : 'p-2 justify-center'
          } ${
            isDark 
              ? 'text-zinc-500 hover:text-red-500 hover:bg-red-500/10' 
              : 'text-zinc-500 hover:text-red-600 hover:bg-red-50'
          }`}
          title={!sidebarExpanded ? 'Logout' : undefined}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {sidebarExpanded && <span>Logout</span>}
        </button>

        {/* API Status */}
        <div className={`flex items-center gap-2 rounded ${isDark ? 'bg-zinc-900' : 'bg-zinc-100'} ${sidebarExpanded ? 'px-3 py-2' : 'p-2 justify-center'}`}>
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
            apiConnected 
              ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]' 
              : 'bg-red-500 animate-pulse'
          }`} />
          {sidebarExpanded && (
            <span className={`text-[10px] font-mono ${isDark ? 'text-zinc-500' : 'text-zinc-600'}`}>
              {apiConnected ? 'API CONNECTED' : 'DISCONNECTED'}
            </span>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
