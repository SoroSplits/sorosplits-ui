import { useState } from "react"
import Button from "../../components/Button"
import SplitterData, {
  DataProps,
  INITIAL_DATA,
} from "../../components/SplitterData"
import PageHeader from "../../components/PageHeader"
import Switch from "../../components/Switch"
import useContract from "../../hooks/useContract"
import { Address } from "soroban-client"
import toast from "react-hot-toast"
import { useRouter } from "next/router"

export default function SetupSplitter() {
  const { push } = useRouter()
  const { deploy, callContract } = useContract()

  const [data, setData] = useState<DataProps[]>(INITIAL_DATA)
  const [mutable, setMutable] = useState<boolean>(false)

  const createSplitter = async () => {
    try {
      toast.loading("Creating splitter contract...")

      const shares = data.map((item) => {
        return {
          shareholder: Address.fromString(item.shareholder),
          share: BigInt(item.share * 100),
        }
      })

      const contractId = await deploy()

      toast.dismiss()
      toast.success("Splitter contract deployed successfully!")
      toast.loading("Initializing splitter contract...")

      await callContract({
        contractId: contractId.toString(),
        method: "init",
        args: {
          shares,
          mutable,
        },
      })

      toast.dismiss()
      toast.success(
        "Splitter contract initialized successfully! Navigating to contract page..."
      )

      setTimeout(() => {
        push(`/splitter/search?contractId=${contractId}`)
      }, 2000)
    } catch (error: any) {
      toast.dismiss()
      if (error.message) toast.error(error.message)
      else toast.error(error)
    }
  }

  return (
    <div className="flex flex-col w-full">
      <PageHeader
        title="Setup Splitter"
        subtitle="Enter addresses and their shares to setup your splitter."
      />

      <div>Test wallets:</div>
      <div>GDUY7J7A33TQWOSOQGDO776GGLM3UQERL4J3SPT56F6YS4ID7MLDERI4</div>
      <div>GB6NVEN5HSUBKMYCE5ZOWSK5K23TBWRUQLZY3KNMXUZ3AQ2ESC4MY4AQ</div>
      <br />

      <div className="flex flex-col gap-8">
        <SplitterData initialData={data} updateData={setData} />

        <Switch
          initialState={false}
          onChange={setMutable}
          text="Allow updating shareholders and shares in the future?"
        />

        <Button
          text="Create Splitter"
          onClick={createSplitter}
          type="primary"
        />
      </div>
    </div>
  )
}
