export interface ILink {
    label: string;
    icon: string;
    permission?: string ;
    command: () => void;
}
