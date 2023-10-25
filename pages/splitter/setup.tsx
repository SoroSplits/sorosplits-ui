import { useState } from "react"
import Input from "../../components/input"
// import { ShareDataKey, Address } from "sorosplits-splitter"
import { CgClose } from "react-icons/cg"
import clsx from "clsx"
import { AiOutlineUserAdd } from "react-icons/ai"
import Button from "../../components/button"

interface DataProps {
  share: number
  shareholder: string
}

export default function SetupSplitter() {
  const [data, setData] = useState<DataProps[]>([
    {
      share: 0,
      shareholder: "",
    },
    {
      share: 0,
      shareholder: "",
    },
  ])

  const updateDataShareholder = (idx: number, value: string) => {
    const newData = [...data]
    newData[idx].shareholder = value
    setData(newData)
  }

  const updateDataShare = (idx: number, value: string) => {
    const newData = [...data]
    newData[idx].share = isNaN(parseInt(value)) ? 0 : parseInt(value)
    setData(newData)
  }

  const removeData = (idx: number) => {
    const newData = [...data]
    newData.splice(idx, 1)
    setData(newData)
  }

  const addData = () => {
    const newData = [...data]
    newData.push({
      share: 0,
      shareholder: "",
    })
    setData(newData)
  }

  const createSplitter = async () => {

  }

  return (
    <div className="flex flex-col w-full">
      <h1 className="text-[64px] font-bold">Setup Splitter</h1>

      <h3>Enter addresses and their shares to setup your splitter.</h3>

      <div className="flex flex-col gap-3 mt-8">
        {data.map((item, idx) => {
          return (
            <div key={idx} className="flex gap-4">
              <Input
                placeholder="User address"
                onChange={(value) => updateDataShareholder(idx, value)}
                value={item.shareholder}
              />
              <Input
                placeholder="Percentage"
                onChange={(value) => updateDataShare(idx, value)}
                small
                value={item.share.toString()}
                subtext="%"
                maxLength={4}
                numeric
              />
              {data.length > 2 && (
                <button
                  className="rounded-lg border-2 border-background-dark h-10 w-10 flex items-center justify-center hover:bg-accent group"
                  onClick={() => removeData(idx)}
                >
                  <CgClose
                    size={14}
                    className="text-text group-hover:text-white"
                  />
                </button>
              )}
            </div>
          )
        })}
      </div>

      <button
        className="flex items-center justify-between px-4 py-1 text-sm w-[110px] bg-secondary hover:bg-secondary-dark mt-5 rounded-md"
        onClick={addData}
      >
        <AiOutlineUserAdd size={16} />
        Add User
      </button>

      <div className="h-10"/>

      <Button
        text="Create Splitter"
        onClick={createSplitter}
        type="primary"
      />
    </div>
  )
}
