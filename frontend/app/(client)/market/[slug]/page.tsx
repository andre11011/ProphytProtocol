import MarketId from "./_components/market-id";

type PageProps = {
  params: Promise<{ slug: string }>;
};

const Page = async (props: PageProps) => {
  const { slug: id } = await props.params;

  return <MarketId id={id} />;
};

export default Page;
