import React, { createContext, useContext, useState } from "react";

const ExtensionContext = createContext();

export function ExtensionProvider({ children }) {
  const [isInsideExtension, setIsInsideExtension] = useState(false);
  return (
    <ExtensionContext.Provider value={{ isInsideExtension, setIsInsideExtension }}>
      {children}
    </ExtensionContext.Provider>
  );
}

export function useExtension() {
  return useContext(ExtensionContext);
}