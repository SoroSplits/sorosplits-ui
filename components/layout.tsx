import { ReactNode } from "react"
import Sidebar from "./sidebar"

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div>
      <Sidebar />
      <div>
        <main>{children}</main>
      </div>
    </div>
  )
}

export default Layout
