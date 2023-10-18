import { isAllowed, setAllowed, getUserInfo } from '@stellar/freighter-api'
import { useEffect } from 'react'

export default function Test() {


    useEffect(() => {
        const setup = async () => {
            const allowed = await isAllowed()
            console.log(allowed)

            if (allowed) {
                const info = await getUserInfo()
                console.log(info)
            }
        }

        setup()
    }, [])

    const connect = async () => {
        await setAllowed()
    }


  return (
    <>
        <button onClick={connect} >Connect</button>
    </>
  )
}
