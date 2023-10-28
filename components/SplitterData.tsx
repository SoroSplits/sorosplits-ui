import { useState } from "react"
import Input from "./Input"
import { CgClose } from "react-icons/cg"
import { AiOutlineUserAdd } from "react-icons/ai"

interface DataProps {
  share: number
  shareholder: string
}

interface SplitterDataProps {
  initialData?: DataProps[]
  updateData: (data: DataProps[]) => void
  locked?: boolean
}

const INITIAL_DATA = [
  {
    share: 0,
    shareholder: "",
  },
  {
    share: 0,
    shareholder: "",
  },
]

const SplitterData = ({
  initialData,
  updateData,
  locked,
}: SplitterDataProps) => {
  const [data, setData] = useState<DataProps[]>(initialData ?? INITIAL_DATA)

  const updateDataShareholder = (idx: number, value: string) => {
    const newData = [...data]
    newData[idx].shareholder = value
    setData(newData)
    updateData(newData)
  }

  const updateDataShare = (idx: number, value: string) => {
    const newData = [...data]
    console.log(value)
    newData[idx].share = parseFloat(value)
    setData(newData)
    updateData(newData)
  }

  const removeData = (idx: number) => {
    const newData = [...data]
    newData.splice(idx, 1)
    setData(newData)
    updateData(newData)
  }

  const addData = () => {
    const newData = [...data]
    newData.push({
      share: 0,
      shareholder: "",
    })
    setData(newData)
    updateData(newData)
  }

  return (
    <div>
      <div className="flex flex-col gap-3">
        {data.map((item, idx) => {
          return (
            <div key={idx} className="flex gap-4">
              <Input
                placeholder="User address"
                onChange={(value) => updateDataShareholder(idx, value)}
                value={item.shareholder}
                disabled={locked}
              />
              <Input
                placeholder="Percentage"
                onChange={(value) => updateDataShare(idx, value)}
                small
                value={item.share.toString()}
                maxLength={4}
                numeric
                disabled={locked}
              />
              {!locked && data.length > 2 && (
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

      {!locked && (
        <button
          className="flex items-center justify-between px-4 py-1 text-sm w-[110px] bg-secondary hover:bg-secondary-dark mt-4 rounded-md"
          onClick={addData}
        >
          <AiOutlineUserAdd size={16} />
          Add User
        </button>
      )}
    </div>
  )
}

export default SplitterData
export { INITIAL_DATA }
export type { DataProps }
