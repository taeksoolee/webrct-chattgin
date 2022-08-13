interface Message {
  type: string,
  label: number | null,
  id: string | null,
  candidate: string,
}

export default Message;