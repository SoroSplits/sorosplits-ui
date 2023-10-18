import { ReactNode } from "react"
import Sidebar from "./sidebar"

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex justify-center">
      <div className="container flex">
        <Sidebar />
        <main className="p-10">{children}</main>
      </div>
    </div>
  )
}

export default Layout
