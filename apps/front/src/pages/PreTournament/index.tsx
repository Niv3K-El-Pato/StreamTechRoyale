import { Text, Button, Loader, Stack, Title, Avatar, Flex, Pagination, Box, Image, Input, TextInput } from "@mantine/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Api, ApiResponse } from "../../api";
import { ChannelsLiveEvent, CreatorDto } from "@streamtechroyale/models";
import CreatorCard from '../../components/CreatorCard';
import type { Engine } from "tsparticles-engine";
import { loadFull } from "tsparticles";
import Particles from "react-tsparticles";
import { particleOptions } from "./particlesOptions";
import { useWsContext } from "../../context/wsContext/useWsContext";
import { BsSearch } from "react-icons/bs";

const FORM_LINK = 'https://forms.gle/Kj2JRGjRrcS8Vb7c9';
const ITEMS_PER_PAGE = 12;

const TOURNAMENT_DATE = 1684008000;

const dateParsed = new Date(TOURNAMENT_DATE * 1000).toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    year: 'numeric',
    minute: '2-digit',
    hourCycle: 'h12',
});

const PreTournament = () => {
    const [page, setPage] = useState<number>(1);
    const [creatorDataPreSearch, setCreatorData] = useState<ApiResponse<CreatorDto[]> | null>(null);
    const [searchValue, setSearchValue] = useState<string>('');
    const wsContext = useWsContext();
    const [liveChannels, setLiveChannels] = useState<Array<CreatorDto>>([]);

    const creatorData = (creatorDataPreSearch?.data ?? []).filter((creator) => {
        const searchValueLowerCased = searchValue.toLowerCase();
        return (
            creator.name.toLowerCase().includes(searchValueLowerCased) ||
            creator.instagram?.toLowerCase().includes(searchValueLowerCased) ||
            creator.twitch?.toLowerCase().includes(searchValueLowerCased) ||
            creator.tiktok?.toLowerCase().includes(searchValueLowerCased) ||
            creator.youtube?.toLowerCase().includes(searchValueLowerCased) ||
            creator.twitter?.toLowerCase().includes(searchValueLowerCased)
        );
    });
    const totalPages = Math.ceil((creatorData.length ?? 1) / ITEMS_PER_PAGE);
    const start = (page - 1) * ITEMS_PER_PAGE;

    useEffect(() => {
        wsContext.subscribeToEvent('channels-live', (event) => {
            setLiveChannels((event as ChannelsLiveEvent).content);
        });

        (async () => {
            const resp = await Api.getCreators(); 
            setCreatorData(resp);
        })();
    }, []);

    const particlesInit = useCallback(async (engine: Engine) => {
        await loadFull(engine);
    }, []);

    const usersWithLive = useMemo(() => creatorData
            .map((creator) => {
                const isLive = liveChannels.find((liveChannel) => liveChannel.id === creator.id);
                return {
                    ...creator,
                    isLive: !!isLive
                }
            })
            .sort((prev, next) => (next.isLive ? 0 : -1))
    , [liveChannels, creatorData]);

    const itemsToDisplay = (usersWithLive).slice(start, start + ITEMS_PER_PAGE);

    return (
    <Box pb={150}>
        <Particles 
            init={particlesInit}
            width="100%"
            height="100%"
            options={particleOptions}
        />
        <Stack align="center" spacing={125} mt={{
            base: 80,
            md: 150,
        }} mb={50}>
            <Stack align="center">
                <Image alt="Stream Tech Royale" src='logo.png' width={150} />
                <Title>Stream Tech Royale</Title>
                <Text fz="xl">Fortnite edition</Text>
            </Stack>

            <Stack align="center" spacing={0}>
                <Text c="dark" fz="xl">{dateParsed}</Text>
                <Button mt="md" size="lg" target="_blank" component="a" href={FORM_LINK} radius="md" variant="outline">
                    UNIRSE
                </Button>
            </Stack>
        </Stack>

        <Box bg="dark">
            <Flex mx='auto' maw={800} direction={{ base: 'column' }} align="flex-start" justify="center" px={{
                    base: 20,
                    xs: 25,
                    sm: 26,
                    md: 130,
                }} py={80}>
                <Box>
                    <Title mb={25} align='center' color="white" order={2}>Premios para la communidad</Title>
                    <Text mt={10} color="white" >Estamos colaborando con patrocinadores para obtener premios para nuestra comunidad.
                        Durante el torneo, los espectadores tendrán la oportunidad de elegir el equipo que desean apoyar, 
                        y si ese equipo resulta ganador, tendrán la posibilidad de obtener premios.
                    </Text>
                </Box>
                <Flex gap={20} wrap='wrap' mx="auto" mt={80} align='center' justify='center'>
                    <Image alt="dev talles" width={200} src="/devtalles.png" />
                    <Image alt="codealo" width={200} src="/codealo-logo-white.png" />
                    <Image alt="donweb" width={200} src="/donweb azul.png" />
                </Flex>
            </Flex>
        </Box>

        <Stack spacing={0} align="center">
            <Flex align="center" my={50}>
                { creatorDataPreSearch?.data && (
                    <Box
                    bg="teal"
                    sx={{
                        borderRadius: '50%',
                        width: '4em',
                        height: '4em',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    >
                        <Text weight="bold" size="2em" color="white">
                            {creatorDataPreSearch.data.length}
                        </Text>
                    </Box>
                ) }
                <Stack ml={10} spacing={0} >
                    <Title order={2}>Creadores</Title>
                    <Text>Luchan por su comunidad</Text>
                </Stack>
            </Flex>

            {!creatorData && ( <Loader />)}

            <Flex
                maw={1500}
                mx={50}
                gap={20} wrap={"wrap"} justify={"center"} align={"center"}>

                {itemsToDisplay.map((data) => (
                    <CreatorCard key={data.id} {...data} isLive={data.isLive} />
                ))}
                {!itemsToDisplay.length && creatorDataPreSearch?.data && (
                    <Text>No encontrado</Text>
                )}
            </Flex>
            <Pagination mt={20} value={page} onChange={setPage} total={totalPages} />
        </Stack>
    </Box>
    );
};


export default PreTournament;